---
title: "Renaming a Table in Prisma and PlanetScale"
description: "Prisma doesn't support table renaming. This post describes the steps we took to rename a table in patoland's database"
pubDate: "Sep 05 2023"
heroImage: "/patoland-blog/blog-placeholder-3.jpg"
---

## Context

[patoland](https://patoland.com) database is on [PlanetScale](https://planetscale.com). We use [Prisma](https://prisma.io) as an ORM and also to handle database migrations.

The first version of patoland didn't include users. Any visitor was able to upload a _pato_, which was stored in a table called `PatosWithoutUser`. This was fine in the early days of patoland development but it was time to change. To support new features, we need to associate the patos with the users that upload them. Otherwise, how can you prove that pato is yours? 😏

## Renaming a table in Prisma and PlanetScale

To associate the patos with a user, we could just add a new column to the `PatosWithoutUser` table. The field would be `userId`. But that leaves us with a `PatosWithoutUser` table that has a `userId` column. Pretty confusing. The best would be to rename the table to `Pato`, but [renaming tables is not supported by Prisma](https://www.prisma.io/docs/concepts/components/prisma-migrate/legacy-migrate#supported-operations).

Our solution was similar to the [Strangler Fig Strategy](https://martinfowler.com/bliki/StranglerFigApplication.html). You create a new thing, start taking over the old thing, and finally remove the old thing. In our specific case that meant:

- Create a new table called `Pato` with all columns from `PatosWithoutUser` plus the `userId` column.
- [Deploy the database changes](#database-migrations-with-prisma-and-planetscale)
- Create a default user.
- Export all rows from `PatosWithoutUser` and import them into `Pato` assigning each pato to the default user.
- Change the code to use the `Pato` table instead of `PatosWithoutUser`.
- Deploy the code by pushing to main.
- Remove the `PatosWithoutUser` table.
- [Deploy the database changes](#database-migrations-with-prisma-and-planetscale)

## Database migrations with Prisma and PlanetScale

Because we use PlanetScale, database migrations work a bit different as recommended by Prisma. We don't use `prisma migrate` at all. We push database changes to a development branch in PlanetScale and then merge the branch into production. You can find more details [here](https://planetscale.com/docs/prisma/automatic-prisma-migrations). The short version is below:

- Create a development branch in PlanetScale
- Open a tunnel to that branch using `pscale connect patoland dev --port 3309`. `patoland` is the database and `dev` is the branch.
- Update your `DATABASE_URL` variable in your `.env` file. This allows Prisma to push the changes to the development branch in PlanetScale. For example, our value is `DATABASE_URL="mysql://root@127.0.0.1:3309/patoland"`.
- Push your changes using `npx prima db push`. This compares the contents of your `schema.prisma` file and the actual schema in the database. The it updates the database schema to match what's in the `schema.prisma` file.
- At this point, your development and production branches are out of sync. You need to create a deployment request so that production catches up. You do that by running `pscale deploy-request create patoland dev`. That command gives you a request number. You will use that number to deploy that request. An example is `Deploy request #5 successfully created.`
- If you are satisfied with your database changes, you can deploy the request. That effectively changes your production branch to match what's in your development branch. Use the request number from the previous step to deploy. e.g. `pscale deploy-request deploy patoland 5`

That's all. Once you get familiar with the concepts, making changing in your production database without downtime is really easy. Thank you for reading this far. Don't forget to visit [patoland](https://patoland.com) and get creative.
