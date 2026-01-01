---
title: "First steps towards Codeberg"
description: "A lot of Europeans are currently talking about Europe having to become more independent from US-based..."
author: "Thomas Künneth"
publishDate: 2025-12-31T11:43:33Z
featuredImage: "https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F37py5lhja1l43d4c2s1a.png"
category: "opensource"
tags: ["opensource", "privacy", "digitalsovereignty", "git"]
draft: false
---

A lot of Europeans are currently talking about Europe having to become more independent from US-based big tech. Being a European myself, I feel the need for this, too. However, just talking won't make a difference. So, why not make this our New Year's resolution? Here's mine: I love open source. Given GitHub's recent trajectory toward centralisation, I feel there are better-suited homes for my repositories. That's why I will start migrating them to **Codeberg**.

### What is Codeberg?

Codeberg is a community-driven non-profit platform for hosting software projects. Many consider it the leading independent alternative to commercial services like GitHub and Bitbucket. While it looks and feels very similar to GitHub, its underlying philosophy and legal structure are fundamentally different: unlike GitHub, which is owned by Microsoft, Codeberg is run by a German non-profit organisation called **Codeberg e.V.**. It is funded by donations rather than venture capital or ads. The platform runs on **Forgejo**, which is a community-governed fork of **Gitea**. Therefore, the very software used to run the site is itself open source and transparent. And it is privacy-focused. Since Codeberg is hosted in the European Union (Germany), it adheres to strict GDPR standards. It does not track users for advertising and avoids black box AI features like GitHub Copilot.

Does this sound appealing? To me it certainly did. That's why I decided to jump right in. In this introductory article, I'll show you my first baby steps, that is, registering and migrating the first GitHub repository.

### Signing up

Registering is a very quick and pleasant experience. Visit https://codeberg.org, find and click the *Register* button.

![Codeberg homepage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5wowngilbf6pv5j3h62t.png)

Just enter a username, your email address, a password, and the randomly generated number or word.

![sign-up page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k6qb7dqghsdizkx4d2my.png)

Once you click on *Register Account*, you should receive an email with the inevitable confirmation link.

![Activation email](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/r6ntbdznrdpkjwfvz323.png)

Click on the link to verify your email address. You will be directed to your personal Codeberg landing page.

![Personal Codeberg landing page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s39kn5gvrg6st9b2vtjd.png)

Next, you may want to update some settings.

![Settings page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/thsrtvo6mmn5x7yyuli6.png)

While I won't walk you through the settings, I would like to encourage you to show your Codeberg account on Mastodon. First, add Mastodon to Codeberg. Look for the *Website* field or the *Social Accounts section* (if available in the current UI). Paste your full Mastodon profile URL (for example, https://mastodon.social/@tkuenneth) and click *Update Profile* at the bottom. Codeberg automatically adds the `rel="me"` attribute to the website link in your profile, which is exactly what Mastodon needs to verify you.

Next, open your Mastodon instance and visit your  *Profile* page. Click *Edit profile* and find the *Extra fields* in *Basic information*. This is where you add labels and links. In the label column, type something like `Codeberg`. In the content column, paste your Codeberg profile URL (e.g., https://codeberg.org/tkuenneth).

Click *Save Changes*. It may take a short while until Mastodon detects that it's you, but in the end, it should look like this:

![A Mastodon profile page with several verified links](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/91vd6ms1bfavhocp1q8b.png)

### Migrating your first repository

To start a migration, click on the *+* symbol on the top right, and select *New migration*.

![Starting a migration from a drop down menu](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m9d79jm525lfns6vvzks.png)

The next step is to select the Git host you want to migrate from. The migration tool can migrate your repository data, as well as metadata like issues, labels, wiki, releases, and milestones.

![Selecting the host](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/wivt2856jmnevel19n0c.png)

The most important piece of information is, of course, the url of the repository you want to migrate. To be able to also migrate metadata, you need to provide an access token.

![Configuring the migration](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/nbrokh6glz38yt2on8ql.png)

Once you have specified the owner, the repository name, and the visibility, you can start the migration by clicking on *Migrate repository*. The following screenshot shows a freshly migrated repo.

![Repository homepage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/uziow5ve79tbjj6k0vcq.png)

### Finalising the migration

Once the new repository has been set up, you may want to update the README of the old repo by mentioning its new home and then archive the content (on GitHub, this makes it *read-only*).

I strongly advise against deleting the old repo. It’s tempting to want a clean break, but there are two big reasons to keep it:

1. Broken Links: There are inevitably links to your code scattered across the web—in blog posts, old commits, or bookmarks—which you would render useless.

2. Security (Namespace Hijacking): This is a risk many people overlook. If you delete a repository, that specific URL becomes available again. Someone else could potentially register that same name and host malicious code where your project used to be. By keeping your old repository as a placeholder or a *tombstone*, you ensure that you still control that space and can point your users safely to Codeberg.

So, the best move is to add a clear migration notice to the top of the README, set the repository to *Archived*, and let it serve as a signpost.

To learn more about migrations to Codeberg, read the official guide at https://docs.codeberg.org/advanced/migrating-repos/.