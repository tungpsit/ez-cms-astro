export type ElementType = 
  | 'section'
  | 'row'
  | 'column'
  | 'text'
  | 'heading'
  | 'image'
  | 'button'
  | 'divider'
  | 'spacer'
  | 'html'
  | 'video'
  | 'icon'
  | 'cta'
  | 'icon-list'
  | 'stats'
  | 'testimonial'
  | 'map'
  | 'card';

export interface ElementStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  borderRadius?: string;
  border?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  boxShadow?: string;
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontFamily?: string;
  width?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  gap?: string;
  opacity?: string;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  style?: ElementStyle;
  className?: string;
  visibility?: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
}

export interface IconListItem {
  id: string;
  icon: string;
  title: string;
  description?: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  subtext?: string;
}

export interface SectionElement extends BaseElement {
  type: 'section';
  settings: {
    fullWidth: boolean;
    containerWidth: 'full' | 'boxed' | 'narrow';
    verticalAlign: 'top' | 'middle' | 'bottom';
  };
  children: string[];
}

export interface RowElement extends BaseElement {
  type: 'row';
  settings: {
    columns: number;
    columnRatio: string;
    gap: string;
    verticalAlign: 'top' | 'middle' | 'bottom' | 'stretch';
  };
  children: string[];
}

export interface ColumnElement extends BaseElement {
  type: 'column';
  settings: {
    width: string;
  };
  children: string[];
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
}

export interface HeadingElement extends BaseElement {
  type: 'heading';
  content: string;
  settings: {
    level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  };
}

export interface ImageElement extends BaseElement {
  type: 'image';
  settings: {
    src: string;
    alt: string;
    link?: string;
    linkTarget?: '_self' | '_blank';
    objectFit?: 'cover' | 'contain' | 'fill';
  };
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  content: string;
  settings: {
    link: string;
    linkTarget: '_self' | '_blank';
    variant: 'primary' | 'secondary' | 'outline' | 'ghost';
    size: 'sm' | 'md' | 'lg';
    icon?: string;
    iconPosition?: 'left' | 'right';
  };
}

export interface DividerElement extends BaseElement {
  type: 'divider';
  settings: {
    style: 'solid' | 'dashed' | 'dotted';
    thickness: string;
    color: string;
  };
}

export interface SpacerElement extends BaseElement {
  type: 'spacer';
  settings: {
    height: string;
  };
}

export interface HtmlElement extends BaseElement {
  type: 'html';
  content: string;
}

export interface VideoElement extends BaseElement {
  type: 'video';
  settings: {
    src: string;
    type: 'youtube' | 'vimeo' | 'self-hosted';
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    controls: boolean;
    poster?: string;
  };
}

export interface IconElement extends BaseElement {
  type: 'icon';
  settings: {
    name: string;
    size: string;
    color: string;
  };
}

export interface CtaElement extends BaseElement {
  type: 'cta';
  settings: {
    eyebrow: string;
    heading: string;
    subheading: string;
    buttonText: string;
    buttonLink: string;
    buttonTarget: '_self' | '_blank';
    buttonVariant: 'primary' | 'secondary' | 'outline';
    alignment: 'left' | 'center';
    layout: 'stacked' | 'inline';
  };
}

export interface IconListElement extends BaseElement {
  type: 'icon-list';
  settings: {
    layout: 'vertical' | 'horizontal';
    columns: number;
    showDividers: boolean;
    items: IconListItem[];
  };
}

export interface StatsElement extends BaseElement {
  type: 'stats';
  settings: {
    columns: number;
    accentColor: string;
    items: StatItem[];
  };
}

export interface TestimonialElement extends BaseElement {
  type: 'testimonial';
  settings: {
    quote: string;
    author: string;
    role: string;
    avatar: string;
    rating: number;
    layout: 'card' | 'split';
    highlight?: string;
  };
}

export interface MapElement extends BaseElement {
  type: 'map';
  settings: {
    address: string;
    zoom: number;
    height: string;
  };
}

export interface CardElement extends BaseElement {
  type: 'card';
  settings: {
    image: string;
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    layout: 'vertical' | 'horizontal';
  };
}

export type PageElement = 
  | SectionElement
  | RowElement
  | ColumnElement
  | TextElement
  | HeadingElement
  | ImageElement
  | ButtonElement
  | DividerElement
  | SpacerElement
  | HtmlElement
  | VideoElement
  | IconElement
  | CtaElement
  | IconListElement
  | StatsElement
  | TestimonialElement
  | MapElement
  | CardElement;

export interface PageBuilderData {
  version: number;
  rootElements: string[];
  elements: Record<string, PageElement>;
}

export interface ElementCategory {
  id: string;
  name: string;
  icon: string;
  elements: {
    type: ElementType;
    name: string;
    icon: string;
    description: string;
  }[];
}

export const ELEMENT_CATEGORIES: ElementCategory[] = [
  {
    id: 'layout',
    name: 'Layout',
    icon: 'layout',
    elements: [
      { type: 'section', name: 'Section', icon: 'square', description: 'Full width container' },
      { type: 'row', name: 'Row', icon: 'columns', description: 'Horizontal container with columns' },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    icon: 'type',
    elements: [
      { type: 'heading', name: 'Heading', icon: 'heading', description: 'Title text (H1-H6)' },
      { type: 'text', name: 'Text', icon: 'align-left', description: 'Paragraph text with formatting' },
      { type: 'image', name: 'Image', icon: 'image', description: 'Single image' },
      { type: 'button', name: 'Button', icon: 'mouse-pointer', description: 'Clickable button' },
      { type: 'divider', name: 'Divider', icon: 'minus', description: 'Horizontal line separator' },
      { type: 'spacer', name: 'Spacer', icon: 'maximize-2', description: 'Empty space' },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    icon: 'play-circle',
    elements: [
      { type: 'image', name: 'Image', icon: 'image', description: 'Single image' },
      { type: 'video', name: 'Video', icon: 'video', description: 'YouTube, Vimeo or self-hosted' },
      { type: 'map', name: 'Map', icon: 'map', description: 'Google Maps embed' },
      { type: 'icon', name: 'Icon', icon: 'star', description: 'Decorative icon' },
    ],
  },
  {
    id: 'blocks',
    name: 'Blocks',
    icon: 'sparkles',
    elements: [
      { type: 'card', name: 'Card', icon: 'layout', description: 'Image with text and button' },
      { type: 'cta', name: 'CTA', icon: 'megaphone', description: 'Call to action banner' },
      { type: 'icon-list', name: 'Icon List', icon: 'list-checks', description: 'List of bullet points with icons' },
      { type: 'stats', name: 'Stats', icon: 'activity', description: 'Metrics grid for highlights' },
      { type: 'testimonial', name: 'Testimonial', icon: 'quote', description: 'Customer feedback block' },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: 'code',
    elements: [
      { type: 'html', name: 'HTML', icon: 'code', description: 'Custom HTML code' },
    ],
  },
];

export function createDefaultElement(type: ElementType, id: string): PageElement {
  const base = {
    id,
    type,
    style: {},
    visibility: { desktop: true, tablet: true, mobile: true },
  };

  const createItemId = () => `item-${Math.random().toString(36).slice(2, 10)}`;

  switch (type) {
    case 'section':
      return {
        ...base,
        type: 'section',
        settings: { fullWidth: true, containerWidth: 'boxed', verticalAlign: 'top' },
        children: [],
      };
    case 'row':
      return {
        ...base,
        type: 'row',
        settings: { columns: 2, columnRatio: '1:1', gap: '24px', verticalAlign: 'stretch' },
        children: [],
      };
    case 'column':
      return {
        ...base,
        type: 'column',
        settings: { width: '50%' },
        children: [],
      };
    case 'text':
      return { ...base, type: 'text', content: '<p>Enter your text here...</p>' };
    case 'heading':
      return {
        ...base,
        type: 'heading',
        content: 'Heading Text',
        settings: { level: 'h2' },
      };
    case 'image':
      return {
        ...base,
        type: 'image',
        settings: { src: '', alt: '', objectFit: 'cover' },
      };
    case 'button':
      return {
        ...base,
        type: 'button',
        content: 'Click Here',
        settings: { link: '#', linkTarget: '_self', variant: 'primary', size: 'md' },
      };
    case 'divider':
      return {
        ...base,
        type: 'divider',
        settings: { style: 'solid', thickness: '1px', color: '#e2e8f0' },
      };
    case 'spacer':
      return { ...base, type: 'spacer', settings: { height: '40px' } };
    case 'html':
      return { ...base, type: 'html', content: '<!-- Your HTML here -->' };
    case 'video':
      return {
        ...base,
        type: 'video',
        settings: { src: '', type: 'youtube', autoplay: false, muted: false, loop: false, controls: true },
      };
    case 'icon':
      return {
        ...base,
        type: 'icon',
        settings: { name: 'star', size: '24px', color: '#000000' },
      };
    case 'cta':
      return {
        ...base,
        type: 'cta',
        settings: {
          eyebrow: 'Ready to launch?',
          heading: 'Get started with our platform',
          subheading: 'Join thousands of businesses already using our tools',
          buttonText: 'Start Free Trial',
          buttonLink: '#',
          buttonTarget: '_self',
          buttonVariant: 'primary',
          alignment: 'center',
          layout: 'stacked',
        },
      };
    case 'icon-list':
      return {
        ...base,
        type: 'icon-list',
        settings: {
          layout: 'vertical',
          columns: 2,
          showDividers: false,
          items: [
            { id: createItemId(), icon: 'sparkles', title: 'Fast setup', description: 'Launch landing pages quickly' },
            { id: createItemId(), icon: 'shield-check', title: 'Secure by default', description: 'Best practices baked in' },
            { id: createItemId(), icon: 'layers', title: 'Composable blocks', description: 'Mix and match any layout' },
          ],
        },
      };
    case 'stats':
      return {
        ...base,
        type: 'stats',
        settings: {
          columns: 3,
          accentColor: '#10b981',
          items: [
            { id: createItemId(), value: '24+', label: 'Elements', subtext: 'ready to use' },
            { id: createItemId(), value: '4x', label: 'Faster builds', subtext: 'versus hand coding' },
            { id: createItemId(), value: '99.9%', label: 'Uptime', subtext: 'hosted experience' },
          ],
        },
      };
    case 'testimonial':
      return {
        ...base,
        type: 'testimonial',
        settings: {
          quote: 'This builder gave our team superpowers and cut build time in half.',
          author: 'Ava Reynolds',
          role: 'Marketing Lead, Linear Labs',
          avatar: 'https://i.pravatar.cc/120?img=32',
          rating: 5,
          layout: 'card',
          highlight: '“A complete game changer.”',
        },
      };
    case 'map':
      return {
        ...base,
        type: 'map',
        settings: { address: 'San Francisco, CA', zoom: 12, height: '400px' },
      };
    case 'card':
      return {
        ...base,
        type: 'card',
        settings: {
          image: '',
          title: 'Card Title',
          description: 'This is a description for the card element. You can edit this text.',
          buttonText: 'Learn More',
          buttonLink: '#',
          layout: 'vertical',
        },
      };
    default:
      return { ...base, type: 'text', content: '' } as TextElement;
  }
}

export function createEmptyPageBuilderData(): PageBuilderData {
  return {
    version: 1,
    rootElements: [],
    elements: {},
  };
}