---
title: "Building an Angular Compiler using AI with Google Gemini"
description: "The Angular Compiler is the pipeline that translates Angular decorator and template syntax into..."
author: "Brandon Roberts"
publishDate: 2025-12-31T17:15:08Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fr9zox7nkkz2vwagdvyua.png"
category: "angular"
tags: ["angular"]
draft: false
---

The Angular Compiler is the pipeline that translates Angular decorator and template syntax into metadata and Ivy runtime instructions. In an exploration using Gemini, I set out to build a "Lite" version of this without the `@angular/compiler-cli` package to learn more about the internals of the Angular Compiler, how Angular transforms components into the static `ɵcmp` and `ɵfac` properties, and how this could influence single-file compilation in the future with build tools such as Vite.

---

## Parsing Decorator Metadata

Every Angular component begins with a `@Component` decorator. My compiler's first task is to statically analyze the metadata. This can be done using the TypeScript Compiler API to scan for classes, decorators, and other properties of the source file.

To research the complex `R3ComponentMetadata` structures, I leveraged **Gemini** as a specialized research agent. By feeding it snippets of the Angular source code, I was able to:

* **Map internal interfaces:** Gemini identified the relationships between the `Component` decorator properties and the internal `R3` metadata required by the `compileComponentFromMetadata` function.
* **Scan for modern APIs:** I used Gemini to help write a static analyzer that identifies **Signal-based APIs** like `input()` and `model()` within class members, ensuring they are registered in the metadata even though they sit outside the decorator.

```typescript
function extractMetadata(dec: ts.Decorator): any {
  const call = dec.expression as ts.CallExpression;
  const obj = call.arguments[0] as ts.ObjectLiteralExpression;
  const meta: any = { hostRaw: {}, inputs: {}, outputs: {}, standalone: true, imports: [], providers: null, viewProviders: null, animations: null, changeDetection: 1, encapsulation: 0, preserveWhitespaces: false, exportAs: null, styles: [], templateUrl: null, styleUrls: [] };
  if (!obj) return meta;
  obj.properties.forEach(p => {
    if (!ts.isPropertyAssignment(p)) return;
    const key = p.name.getText().replace(/['"`]/g, ''), valNode = p.initializer, valText = valNode.getText();
    switch (key) {
      case 'host': if (ts.isObjectLiteralExpression(valNode)) valNode.properties.forEach(hp => { if (ts.isPropertyAssignment(hp)) meta.hostRaw[hp.name.getText().replace(/['"`]/g, '')] = hp.initializer.getText().replace(/['"`]/g, ''); }); break;
      case 'changeDetection': meta.changeDetection = valText.includes('OnPush') ? 0 : 1; break;
      case 'encapsulation': meta.encapsulation = valText.includes('None') ? 2 : (valText.includes('ShadowDom') ? 3 : 0); break;
      case 'preserveWhitespaces': meta.preserveWhitespaces = valText === 'true'; break;
      case 'exportAs': meta.exportAs = [valText.replace(/['"`]/g, '')]; break;
      case 'templateUrl': meta.templateUrl = valText.replace(/['"`]/g, ''); break;
      case 'styleUrls': if (ts.isArrayLiteralExpression(valNode)) meta.styleUrls = valNode.elements.map(e => e.getText().replace(/['"`]/g, '')); break;
      case 'styles': if (ts.isArrayLiteralExpression(valNode)) meta.styles = valNode.elements.map(e => e.getText().replace(/['"`]/g, '')); break;
      case 'imports': case 'providers': case 'viewProviders': case 'animations': case 'rawImports': if (ts.isArrayLiteralExpression(valNode)) meta[key] = valNode.elements.map(e => new o.WrappedNodeExpr(e)); break;
      default: meta[key] = valText.replace(/['"`]/g, '');
    }
  });
  return meta;
}
```

This function collects all the necessary metadata from the Component decorator, and translates into TypeScript expressions that can be passed to the `compileComponentFromMetadata` function.

---

## Parsing the Component Template

After metadata is gathered, the next step is processing the `template` string. Using the official `@angular/compiler`'s `parseTemplate` function, raw HTML is converted into a Angular's **Render3 AST**.

Gemini assisted in deciphering the **AST Node** documentation, helping me understand how high-level syntax—like the new `@if` control flow—is converted into discrete internal nodes that the code generator can understand.

```typescript
const parsedTemplate = parseTemplate(templateString, fileName, {
  preserveWhitespaces: false,
});
```

The `parseTemplate` function has many use cases; for example, it is used by Angular ESLint to analyze the AST and validate lint rules. It's also used in Angular migrations to detect legacy syntax that can be migrated to newer syntax.


```typescript
// The result is a collection of nodes (Element, BoundText, etc.)
const templateNodes = parsedTemplate.nodes;
```

As the result can be fed directly into the component compiler function, not much extra transformation is needed here.

```ts
    const cmp = compileComponentFromMetadata({
      // other metadata
      template: {
        nodes: parsedTemplate.nodes,
        ngContentSelectors: parsedTemplate.ngContentSelectors,
        preserveWhitespaces: parsedTemplate.preserveWhitespaces
      }
    });
```

There's much more metadata that's needed to compile an Angular component, but these are the necessary parts for incorporating the template.

---

## Translating the Output AST

The next phase is translating Angular's internal "Output AST" back into valid TypeScript code. This was achieved an **Exhaustive Visitor Pattern**, mapping Angular nodes to **TypeScript Factory** calls.

Initially, Gemini generated some utility functions to translate Angular's AST output to TypeScript code. 

```ts
function translateOutputASTStatement(stmt: o.Statement, printer: ts.Printer, sf: ts.SourceFile): string | ts.Statement {
  let tsStmt: ts.Statement;

  if (stmt instanceof o.ReturnStatement) {
    tsStmt = ts.factory.createReturnStatement(translateOutputAST(stmt.value));
  } else if (stmt instanceof o.DeclareVarStmt) {
    tsStmt = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(stmt.name, undefined, undefined, stmt.value ? translateOutputAST(stmt.value) : undefined)],
        stmt.hasModifier(o.StmtModifier.Final) ? ts.NodeFlags.Const : ts.NodeFlags.Let
      )
    );
  } else if (stmt instanceof o.IfStmt) {
    tsStmt = ts.factory.createIfStatement(
      translateOutputAST(stmt.condition),
      ts.factory.createBlock(stmt.trueCase.map(s => translateOutputASTStatement(s, null as any, null as any) as ts.Statement), true),
      stmt.falseCase.length ? ts.factory.createBlock(stmt.falseCase.map(s => translateOutputASTStatement(s, null as any, null as any) as ts.Statement), true) : undefined
    );
  } else if (stmt instanceof o.ExpressionStatement) {
    tsStmt = ts.factory.createExpressionStatement(translateOutputAST(stmt.expr));
  } else {
    tsStmt = ts.factory.createEmptyStatement();
  }

  return printer ? printer.printNode(ts.EmitHint.Unspecified, tsStmt, sf) : tsStmt;
}

function translateOutputAST(expr: o.Expression): ts.Expression {
  // Literals
  if (expr instanceof o.LiteralExpr) {
    if (typeof expr.value === 'string') return ts.factory.createStringLiteral(expr.value);
    if (typeof expr.value === 'number') return ts.factory.createNumericLiteral(String(expr.value));
    if (typeof expr.value === 'boolean') return expr.value ? ts.factory.createTrue() : ts.factory.createFalse();
    return ts.factory.createNull();
  }

  // References & Core Bridge
  if (expr instanceof o.ExternalExpr) {
    return ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('i0'), ts.factory.createIdentifier(expr.value.name!));
  }
  if (expr instanceof o.ReadVarExpr) return ts.factory.createIdentifier(expr.name);
  if (expr instanceof o.ReadPropExpr) return ts.factory.createPropertyAccessExpression(translateOutputAST(expr.receiver), expr.name);
  if (expr instanceof o.ReadKeyExpr) return ts.factory.createElementAccessExpression(translateOutputAST(expr.receiver), translateOutputAST(expr.index));

  // Functions & Constructors
  if (expr instanceof o.FunctionExpr) {
    return ts.factory.createArrowFunction(
      undefined, undefined,
      expr.params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p.name, undefined, undefined, undefined)),
      undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.factory.createBlock(expr.statements.map(s => translateOutputASTStatement(s, null as any, null as any) as ts.Statement), true)
    );
  }
  if (expr instanceof o.InvokeFunctionExpr) return ts.factory.createCallExpression(translateOutputAST(expr.fn), undefined, expr.args.map(translateOutputAST));
  // if (expr instanceof ts.stat.InvokeMethodExpr) {
  //   return ts.factory.createCallExpression(
  //     ts.factory.createPropertyAccessExpression(translateOutputAST(expr.receiver), expr.name),
  //     undefined, expr.args.map(translateOutputAST)
  //   );
  // }
  if (expr instanceof o.InstantiateExpr) {
    return ts.factory.createNewExpression(translateOutputAST(expr.classExpr), undefined, expr.args.map(translateOutputAST));
  }

  // Operators & Logic
  if (expr instanceof o.BinaryOperatorExpr) {
    const opMap: Record<o.BinaryOperator, ts.BinaryOperator> = {
      [o.BinaryOperator.And]: ts.SyntaxKind.AmpersandAmpersandToken, [o.BinaryOperator.Or]: ts.SyntaxKind.BarBarToken,
      [o.BinaryOperator.Equals]: ts.SyntaxKind.EqualsEqualsToken, [o.BinaryOperator.Identical]: ts.SyntaxKind.EqualsEqualsEqualsToken,
      [o.BinaryOperator.NotEquals]: ts.SyntaxKind.ExclamationEqualsToken, [o.BinaryOperator.NotIdentical]: ts.SyntaxKind.ExclamationEqualsEqualsToken,
      [o.BinaryOperator.Minus]: ts.SyntaxKind.MinusToken, [o.BinaryOperator.Plus]: ts.SyntaxKind.PlusToken,
      [o.BinaryOperator.Divide]: ts.SyntaxKind.SlashToken, [o.BinaryOperator.Multiply]: ts.SyntaxKind.AsteriskToken,
      [o.BinaryOperator.Modulo]: ts.SyntaxKind.PercentToken, [o.BinaryOperator.Lower]: ts.SyntaxKind.LessThanToken,
      [o.BinaryOperator.LowerEquals]: ts.SyntaxKind.LessThanEqualsToken, [o.BinaryOperator.Bigger]: ts.SyntaxKind.GreaterThanToken,
      [o.BinaryOperator.BiggerEquals]: ts.SyntaxKind.GreaterThanEqualsToken, [o.BinaryOperator.BitwiseAnd]: ts.SyntaxKind.AmpersandToken
    };
    return ts.factory.createBinaryExpression(translateOutputAST(expr.lhs), opMap[expr.operator] ?? ts.SyntaxKind.PlusToken, translateOutputAST(expr.rhs));
  }
  if (expr instanceof o.NotExpr) return ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, translateOutputAST(expr.condition));
  if (expr instanceof o.TypeofExpr) return ts.factory.createTypeOfExpression(translateOutputAST(expr.expr));
  if (expr instanceof o.ConditionalExpr) {
    return ts.factory.createConditionalExpression(translateOutputAST(expr.condition), ts.factory.createToken(ts.SyntaxKind.QuestionToken), translateOutputAST(expr.trueCase), ts.factory.createToken(ts.SyntaxKind.ColonToken), translateOutputAST(expr.falseCase!));
  }

  // Collections
  if (expr instanceof o.LiteralMapExpr) {
    return ts.factory.createObjectLiteralExpression(expr.entries.map(e => ts.factory.createPropertyAssignment(e.quoted ? ts.factory.createStringLiteral(e.key) : ts.factory.createIdentifier(e.key), translateOutputAST(e.value))), true);
  }
  if (expr instanceof o.LiteralArrayExpr) return ts.factory.createArrayLiteralExpression(expr.entries.map(translateOutputAST), true);

  // Wrappers
  if (expr instanceof o.WrappedNodeExpr) return expr.node as ts.Expression;

  return ts.factory.createNull();
}
```

This proved to be error-prone and lacked sufficient coverage of edge cases. Through some digging into Angular source code, prompting Gemini to implement the visitor pattern was much more comprehensive.

```typescript
import * as o from '@angular/compiler';
import * as ts from 'typescript';

export class AstTranslator implements o.ExpressionVisitor, o.StatementVisitor {
	// --- Non-exported or Version-Specific Expression Methods ---

	visitWritePropExpr(ast: any, context: any) {
		return ts.factory.createBinaryExpression(
			ast.receiver.visitExpression(this, context),
			ts.SyntaxKind.EqualsToken,
			ast.value.visitExpression(this, context)
		);
	}

	visitInvokeMethodExpr(ast: any, context: any) {
		return ts.factory.createCallExpression(
			ts.factory.createPropertyAccessExpression(
				ast.receiver.visitExpression(this, context),
				ast.name
			),
			undefined,
			ast.args.map((a: any) => a.visitExpression(this, context))
		);
	}

	visitWriteKeyExpr(ast: any, context: any) {
		return ts.factory.createBinaryExpression(
			ts.factory.createElementAccessExpression(
				ast.receiver.visitExpression(this, context),
				ast.index.visitExpression(this, context)
			),
			ts.SyntaxKind.EqualsToken,
			ast.value.visitExpression(this, context)
		);
	}

	visitTaggedTemplateLiteralExpr(ast: any, context: any) {
		const elements = ast.template.elements;
		const expressions = ast.template.expressions;

		const head = ts.factory.createTemplateHead(elements[0].text, elements[0].text);
		const spans = expressions.map((expr: any, i: number) => {
			const element = elements[i + 1];
			const literal = i === expressions.length - 1
				? ts.factory.createTemplateTail(element.text, element.text)
				: ts.factory.createTemplateMiddle(element.text, element.text);
			return ts.factory.createTemplateSpan(expr.visitExpression(this, context), literal);
		});

		return ts.factory.createTaggedTemplateExpression(
			ast.tag.visitExpression(this, context),
			undefined,
			ts.factory.createTemplateExpression(head, spans)
		);
	}

	// --- Standard Expression Visitor Methods ---

	// Support Defer dependency tracking variables
	visitReadVarExpr(ast: o.ReadVarExpr, context: any) {
		return ts.factory.createIdentifier(ast.name);
	}

	visitReadPropExpr(ast: o.ReadPropExpr, context: any) {
		return ts.factory.createPropertyAccessExpression(ast.receiver.visitExpression(this, context), ast.name);
	}

	visitReadKeyExpr(ast: o.ReadKeyExpr, context: any) {
		return ts.factory.createElementAccessExpression(ast.receiver.visitExpression(this, context), ast.index.visitExpression(this, context));
	}

	visitLiteralExpr(ast: o.LiteralExpr, context: any) {
		if (typeof ast.value === 'string') {
			return ts.factory.createStringLiteral(ast.value);
		}
		if (typeof ast.value === 'number') {
			if (ast.value < 0) {
				return ts.factory.createPrefixUnaryExpression(
					ts.SyntaxKind.MinusToken,
					ts.factory.createNumericLiteral(Math.abs(ast.value).toString())
				);
			}
			return ts.factory.createNumericLiteral(ast.value.toString());
		}
		if (typeof ast.value === 'boolean') return ast.value ? ts.factory.createTrue() : ts.factory.createFalse();
		return ts.factory.createNull();
	}

	visitLiteralArrayExpr(ast: o.LiteralArrayExpr, context: any) {
		return ts.factory.createArrayLiteralExpression(
			ast.entries.map(e => {
				// Safety check: sometimes the compiler emits null entries for empty slots
				if (!e) return ts.factory.createNull();
				return e.visitExpression(this, context);
			}),
			true
		);
	}

	visitLiteralMapExpr(ast: o.LiteralMapExpr, context: any) {
		return ts.factory.createObjectLiteralExpression(
			ast.entries.map(e => ts.factory.createPropertyAssignment(
				e.quoted ? ts.factory.createStringLiteral(e.key) : ts.factory.createIdentifier(e.key),
				// Fix: Added safety check for null entries in metadata maps
				e.value ? e.value.visitExpression(this, context) : ts.factory.createNull()
			)),
			true
		);
	}

	// Ensure visitInvokeFunctionExpr is fully mapping all arguments for v21
	visitInvokeFunctionExpr(ast: o.InvokeFunctionExpr, context: any) {
		return ts.factory.createCallExpression(
			ast.fn.visitExpression(this, context),
			undefined,
			ast.args.map(a => a.visitExpression(this, context))
		);
	}

	visitInstantiateExpr(ast: o.InstantiateExpr, context: any) {
		return ts.factory.createNewExpression(ast.classExpr.visitExpression(this, context), undefined, ast.args.map(a => a.visitExpression(this, context)));
	}

	visitTemplateLiteralExpr(ast: o.TemplateLiteralExpr, context: any) {
		const headText = ast.elements[0].text;
		const head = ts.factory.createTemplateHead(headText, headText);
		const spans = ast.expressions.map((expr, i) => {
			const isLast = i === ast.expressions.length - 1;
			const content = ast.elements[i + 1].text;
			const literal = isLast ? ts.factory.createTemplateTail(content, content) : ts.factory.createTemplateMiddle(content, content);
			return ts.factory.createTemplateSpan(expr.visitExpression(this, context), literal);
		});
		return ts.factory.createTemplateExpression(head, spans);
	}

	visitBinaryOperatorExpr(ast: o.BinaryOperatorExpr, context: any) {
		const opMap: Record<o.BinaryOperator, ts.BinaryOperator> = {
			[o.BinaryOperator.Equals]: ts.SyntaxKind.EqualsEqualsToken,
			[o.BinaryOperator.NotEquals]: ts.SyntaxKind.ExclamationEqualsToken,
			[o.BinaryOperator.Assign]: ts.SyntaxKind.EqualsToken,
			[o.BinaryOperator.Identical]: ts.SyntaxKind.EqualsEqualsEqualsToken,
			[o.BinaryOperator.NotIdentical]: ts.SyntaxKind.ExclamationEqualsEqualsToken,
			[o.BinaryOperator.Minus]: ts.SyntaxKind.MinusToken,
			[o.BinaryOperator.Plus]: ts.SyntaxKind.PlusToken,
			[o.BinaryOperator.Divide]: ts.SyntaxKind.SlashToken,
			[o.BinaryOperator.Multiply]: ts.SyntaxKind.AsteriskToken,
			[o.BinaryOperator.Modulo]: ts.SyntaxKind.PercentToken,
			[o.BinaryOperator.And]: ts.SyntaxKind.AmpersandAmpersandToken,
			[o.BinaryOperator.Or]: ts.SyntaxKind.BarBarToken,
			[o.BinaryOperator.BitwiseOr]: ts.SyntaxKind.BarToken,
			[o.BinaryOperator.BitwiseAnd]: ts.SyntaxKind.AmpersandToken,
			[o.BinaryOperator.Lower]: ts.SyntaxKind.LessThanToken,
			[o.BinaryOperator.LowerEquals]: ts.SyntaxKind.LessThanEqualsToken,
			[o.BinaryOperator.Bigger]: ts.SyntaxKind.GreaterThanToken,
			[o.BinaryOperator.BiggerEquals]: ts.SyntaxKind.GreaterThanEqualsToken,
			[o.BinaryOperator.NullishCoalesce]: ts.SyntaxKind.QuestionQuestionToken,
			[o.BinaryOperator.Exponentiation]: ts.SyntaxKind.AsteriskAsteriskToken,
			[o.BinaryOperator.In]: ts.SyntaxKind.InKeyword,
			[o.BinaryOperator.AdditionAssignment]: ts.SyntaxKind.PlusEqualsToken,
			[o.BinaryOperator.SubtractionAssignment]: ts.SyntaxKind.MinusEqualsToken,
			[o.BinaryOperator.MultiplicationAssignment]: ts.SyntaxKind.AsteriskEqualsToken,
			[o.BinaryOperator.DivisionAssignment]: ts.SyntaxKind.SlashEqualsToken,
			[o.BinaryOperator.RemainderAssignment]: ts.SyntaxKind.PercentEqualsToken,
			[o.BinaryOperator.ExponentiationAssignment]: ts.SyntaxKind.AsteriskAsteriskEqualsToken,
			[o.BinaryOperator.AndAssignment]: ts.SyntaxKind.AmpersandAmpersandEqualsToken,
			[o.BinaryOperator.OrAssignment]: ts.SyntaxKind.BarBarEqualsToken,
			[o.BinaryOperator.NullishCoalesceAssignment]: ts.SyntaxKind.QuestionQuestionEqualsToken,
		};
		return ts.factory.createBinaryExpression(ast.lhs.visitExpression(this, context), opMap[ast.operator] ?? ts.SyntaxKind.PlusToken, ast.rhs.visitExpression(this, context));
	}

	visitConditionalExpr(ast: o.ConditionalExpr, context: any) {
		return ts.factory.createConditionalExpression(ast.condition.visitExpression(this, context), ts.factory.createToken(ts.SyntaxKind.QuestionToken), ast.trueCase.visitExpression(this, context), ts.factory.createToken(ts.SyntaxKind.ColonToken), ast.falseCase!.visitExpression(this, context));
	}

	visitNotExpr(ast: o.NotExpr, context: any) {
		return ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.ExclamationToken, ast.condition.visitExpression(this, context));
	}

	visitTypeofExpr(ast: o.TypeofExpr, context: any) {
		return ts.factory.createTypeOfExpression(ast.expr.visitExpression(this, context));
	}

	visitUnaryOperatorExpr(ast: o.UnaryOperatorExpr, context: any) {
		const ops = { [o.UnaryOperator.Minus]: ts.SyntaxKind.MinusToken, [o.UnaryOperator.Plus]: ts.SyntaxKind.PlusToken };
		return ts.factory.createPrefixUnaryExpression(ops[ast.operator] ?? ts.SyntaxKind.PlusToken, ast.expr.visitExpression(this, context));
	}

	visitFunctionExpr(ast: o.FunctionExpr, context: any) {
		return ts.factory.createArrowFunction(undefined, undefined, ast.params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p.name)), undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.factory.createBlock(ast.statements.map(s => s.visitStatement(this, context)), true));
	}

	visitArrowFunctionExpr(ast: o.ArrowFunctionExpr, context: any) {
		return ts.factory.createArrowFunction(undefined, undefined, ast.params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p.name)), undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ast.body.visitExpression(this, context));
	}

	visitDynamicImportExpr(ast: o.DynamicImportExpr, context: any) {
		return ts.factory.createCallExpression(ts.factory.createToken(ts.SyntaxKind.ImportKeyword) as any, undefined, [ast.url.visitExpression(this, context)]);
	}

	visitParenthesizedExpr(ast: o.ParenthesizedExpr, context: any) {
		return ts.factory.createParenthesizedExpression(ast.expr.visitExpression(this, context));
	}

	visitCommaExpr(ast: o.CommaExpr, context: any) {
		return ast.parts.map(p => p.visitExpression(this, context)).reduce((p, c) => ts.factory.createBinaryExpression(p, ts.SyntaxKind.CommaToken, c));
	}

	visitVoidExpr(ast: o.VoidExpr, context: any) {
		return ts.factory.createVoidExpression(ast.expr.visitExpression(this, context));
	}

	visitLocalizedString(ast: o.LocalizedString, context: any) {
		throw new Error('i18n is not supported');
	}

	visitRegularExpressionLiteral(ast: o.RegularExpressionLiteralExpr, context: any) {
		return ts.factory.createRegularExpressionLiteral(`/${ast.pattern}/${ast.flags}`);
	}

	visitTemplateLiteralElementExpr(ast: o.TemplateLiteralElementExpr, context: any) {
		return ts.factory.createStringLiteral(ast.text);
	}

	visitWrappedNodeExpr(ast: o.WrappedNodeExpr<any>, context: any) {
		// This is how Angular passes back original TS nodes (like Signal calls)
		// into the generated code.
		return ast.node as ts.Expression;
	}

	visitExternalExpr(ast: o.ExternalExpr, context: any) {
		return ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('i0'), ts.factory.createIdentifier(ast.value.name!));
	}

	// --- Statement Visitor Methods ---

	visitDeclareVarStmt(stmt: o.DeclareVarStmt, context: any) {
		return ts.factory.createVariableStatement(undefined, ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(stmt.name, undefined, undefined, stmt.value ? stmt.value.visitExpression(this, context) : undefined)], stmt.hasModifier(o.StmtModifier.Final) ? ts.NodeFlags.Const : ts.NodeFlags.Let));
	}

	visitDeclareFunctionStmt(stmt: o.DeclareFunctionStmt, context: any) {
		return ts.factory.createFunctionDeclaration(undefined, undefined, stmt.name, undefined, stmt.params.map(p => ts.factory.createParameterDeclaration(undefined, undefined, p.name)), undefined, ts.factory.createBlock(stmt.statements.map(s => s.visitStatement(this, context)), true));
	}

	visitExpressionStmt(stmt: o.ExpressionStatement, context: any) {
		return ts.factory.createExpressionStatement(stmt.expr.visitExpression(this, context));
	}

	visitReturnStmt(stmt: o.ReturnStatement, context: any) {
		return ts.factory.createReturnStatement(stmt.value.visitExpression(this, context));
	}

	visitIfStmt(stmt: o.IfStmt, context: any) {
		return ts.factory.createIfStatement(stmt.condition.visitExpression(this, context), ts.factory.createBlock(stmt.trueCase.map(s => s.visitStatement(this, context)), true), stmt.falseCase.length ? ts.factory.createBlock(stmt.falseCase.map(s => s.visitStatement(this, context)), true) : undefined);
	}
}
```

---

## Example: From Source to Ivy Output

Here is a sample standalone component using Signals and its actual compiled Ivy output. Note how the `@Component` decorator is replaced by static properties that use imperative instructions like `ɵɵelementStart` and `ɵɵtext`.

### Input Source

```typescript
import { Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    Count: {{ count() }}

    <button (click)="increment()">Increment</button>
		<button (click)="decrement()">Decrement</button>

		@if(show()) {
			<div>Hello {{ name() }}</div>
		}
  `
})
export class Counter {
	name = input();
  count = signal(0);
	show = computed(() => this.count() > 5);

  increment() {
    this.count.update(cnt => ++cnt);
  }

  decrement() {
    this.count.update(cnt => --cnt);
  }	
}

```

### Actual Ivy Output

```javascript
import*as i0 from "/node_modules/.vite/deps/@angular_core.js?v=0f32e3a9";
import {computed, input, signal} from "/node_modules/.vite/deps/@angular_core.js?v=0f32e3a9";
export class Counter {
    constructor() {
        this.name = input();
        this.count = signal(0);
        this.show = computed( () => this.count() > 5);
    }
    increment() {
        this.count.update( (cnt) => ++cnt);
    }
    decrement() {
        this.count.update( (cnt) => --cnt);
    }
    static{this.ɵfac = (__ngFactoryType__) => {
        return new (__ngFactoryType__ || Counter)();
    }
    ;
    }static{this.ɵcmp = i0.ɵɵdefineComponent({
        type: Counter,
        selectors: [["app-counter"]],
        inputs: {
            name: [3, "name", "name", null]
        },
        decls: 6,
        vars: 2,
        consts: [[3, "click"]],
        template: (rf, ctx) => {
            if (rf & 1) {
                i0.ɵɵtext(0);
                i0.ɵɵdomElementStart(1, "button", 0);
                i0.ɵɵdomListener("click", () => {
                    return ctx.increment();
                }
                );
                i0.ɵɵtext(2, "Increment");
                i0.ɵɵdomElementEnd();
                i0.ɵɵdomElementStart(3, "button", 0);
                i0.ɵɵdomListener("click", () => {
                    return ctx.decrement();
                }
                );
                i0.ɵɵtext(4, "Decrement");
                i0.ɵɵdomElementEnd();
                i0.ɵɵconditionalCreate(5, Counter_Conditional_5_Template, 2, 1, "div");
            }
            if (rf & 2) {
                i0.ɵɵtextInterpolate1(" Count: ", ctx.count(), " ");
                i0.ɵɵadvance(5);
                i0.ɵɵconditional(ctx.show() ? 5 : -1);
            }
        }
        ,
        encapsulation: 2
    });
    }
}
function Counter_Conditional_5_Template(rf, ctx) {
    if (rf & 1) {
        i0.ɵɵdomElementStart(0, "div");
        i0.ɵɵtext(1);
        i0.ɵɵdomElementEnd();
    }
    if (rf & 2) {
        const ctx_r0 = i0.ɵɵnextContext();
        i0.ɵɵadvance();
        i0.ɵɵtextInterpolate1("Hello ", ctx_r0.name());
    }
}
```

## It's Just the Beginning

There's so much more to learn about the Angular compiler, including registering and linking components, directives, pipes, and injectables, handling complex control flow syntax, providers, and more. Angular's compilation still needs global analysis of its dependencies in order to generate the correct output for templates. This is what makes [selectorless](https://github.com/angular/angular/pull/60724) pretty important if the Angular team continues to explore the direction towards true [single file compilation](https://github.com/angular/angular/issues/43165). Using Gemini as a research tool helped me understand the internals of Angular Compiler APIs, generate working code that was understandable for a prototype, and provided a feedback loop for understanding and fixing errors.

Check out the GitHub repo: https://github.com/brandonroberts/angular-compiler-gemini

I'm looking forward to iterating on this more, as it gave me much more clarity, having implemented Analog SFCs as a translation layer to an Angular component.

If you enjoyed this post, click the :heart: so other people will see it. Follow [AnalogJS](https://twitter.com/analogjs) and [me] (https://twitter.com/brandontroberts) on Twitter/X, and subscribe to my [YouTube Channel](https://youtube.com/brandonrobertsdev?sub_confirmation=1) for more content!