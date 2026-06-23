# MediaMTX Next MVC RBAC Dashboard

Updated package with redesigned Settings page.

## Latest update

- Redesigned `Settings` from zero.
- Smaller, clearer, non-technical UX.
- Sections: General, Network, Streaming, Recording, Security.
- Search inside settings.
- Compact overview cards.
- Save / reset buttons.
- Syrian Identity inspired color system.
- Responsive layout for desktop and mobile.

## Run

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```
