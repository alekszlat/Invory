# A tour of the Invory website

This guide walks through every screen of the website: what it is for, who uses it, and what can be done there. Screen names are given in Bulgarian, exactly as they appear. The "Code" line points developers to the matching file.

## How the pieces fit together

1. Someone **creates a register** and becomes its administrator.
2. The administrator **adds assets** to it.
3. The administrator **creates a subregister**, such as one room, and picks which assets belong to it.
4. The administrator **sends an invitation link** to a colleague.
5. The colleague **checks the assets** and reports anything that differs.
6. The administrator **approves or rejects** those reports.
7. Everything is **logged in the history**.

The three roles are explained in the [API guide](api-contract.md#who-is-allowed-to-do-what).

## Sign-in page

**For:** everyone who is not logged in.

One card with two modes. A link at the bottom switches between them.

- **Вход в профила** (log in): email and password.
- **Създаване на профил** (sign up): full name, email, password of at least 8 characters, and the password again.

The eye icon shows or hides the typed password. Problems appear right under the box they concern, such as "this email already has a profile". If the person arrived through an invitation link, a blue note says so, and the invitation opens as soon as they are in.

Code: `src/features/auth/LoginPage.jsx`

## The frame around every page

**For:** everyone who is logged in.

- **Left menu:** the five sections below. **Заявки** shows a number when requests are waiting for a decision. **Нов регистър** at the bottom is a shortcut for creating a register. On phones the menu moves to the top.
- **Top bar:** the current section's name, the person's name, and **Изход** (log out).
- **Green and red strips** at the top of the page confirm that something was saved or explain what went wrong.

Code: `src/app/AppShell.jsx`, `src/app/navigation.js`

## Работни регистри (Working registers)

**For:** administrators. This is the home page.

Shows a card for each register the person runs, with its description and number of assets. **Нов регистър** creates another one. A brand-new account sees an empty page with a button to create the first register.

Code: `src/features/registers/RegisterList.jsx`, `RegisterCard.jsx`, `RegisterDialog.jsx`

## Inside a register

**For:** the register's administrator. Opened from a card on the home page.

- A table of assets with name, inventory number, location, person responsible, quantity, and status.
- A search box and a status filter. Long lists are split into pages.
- **Добави актив** adds an asset.
- **Подрегистри** jumps to this register's subregisters.
- **Редактирай регистъра** changes its name or description.

Code: `src/features/assets/RegisterView.jsx`, `AssetTable.jsx`, `AssetFilters.jsx`

## An asset's details

**For:** anyone who can see the asset. Opened by clicking its name in the table.

Shows all the information about one asset. Administrators also get:

- **Редактирай:** change any field.
- **Архивирай:** take it out of everyday lists. Its record and history are kept.

The add and edit form requires a name, inventory number, location, and quantity. The inventory number cannot repeat within the register.

Code: `src/features/assets/AssetDetails.jsx`, `AssetDialog.jsx`

## Подрегистри (Subregisters)

**For:** administrators.

A subregister is a selected part of a register, used to share only some assets with some people. The assets stay in the main register and are not copied.

Choose a register at the top, then a subregister from the list. For the selected subregister you can:

- **Преименувай:** rename it.
- **Избери активи:** tick which assets belong to it.
- **Покани профил:** create an invitation link.
- See who has joined, change each person's role, or remove them.
- Open the history of that subregister.

Code: `src/features/subregisters/SubregistersView.jsx`, `SubregisterDialogs.jsx`

## Creating an invitation (the Покани профил window)

**For:** administrators.

Pick a role and an end date (one week ahead by default), then press **Генерирай връзка**. Copy the link and send it to the person by email or chat, since the website does not send it for you.

- **Участник (Participant)** can check assets and send requests.
- **Гост (Guest)** can only look and search.

The window also lists earlier links. **Отмени** cancels one so that nobody else can use it. People who already joined keep their access until removed from the subregister's member list.

Code: `InviteDialog` in `src/features/subregisters/SubregisterDialogs.jsx`

## Accepting an invitation

**For:** the person who received a link.

Opening the link leads to the sign-in page if needed, then to a short page with **Приеми поканата**. After accepting, the subregister opens and also appears under **Поканени регистри**.

Code: `AcceptInvitation` in `src/App.jsx`

## Поканени регистри (Registers I was invited to)

**For:** participants and guests.

Shows a card for each subregister the person joined, with their role and the number of assets. Opening one shows its asset table with search and filters.

Participants also get two buttons on each asset, except assets already written off:

- **Свери** (check): report that the asset is here, is missing, or has moved. "Here" is recorded immediately. The other two go to the administrator.
- **Предложи бракуване** (propose writing off): asks the administrator to write it off, with a reason.

Guests see the same table without those buttons.

Code: `src/features/invitations/InvitedList.jsx`, `src/features/requests/RequestDialogs.jsx`

## Заявки (Requests)

**For:** administrators and participants. Everyone sees the same page, with three lists:

- **Входящи** (incoming): requests waiting for this person's decision. **Одобри** approves. **Отхвърли** rejects, and needs a reason.
- **Подадени от мен** (sent by me): this person's own requests and how they ended.
- **Обработени входящи** (decided): incoming requests that have already been decided.

Approving a change of location updates the asset. Approving a writing-off marks it `Бракуван`. Approving "missing" only acknowledges the report.

Code: `src/features/requests/RequestsView.jsx`, `RequestDialogs.jsx`

## История (History)

**For:** everyone who has access to a register or subregister.

A dated log of what happened and who did it: assets added or changed, requests decided, access changed. Choose which register or subregister to view at the top. Nothing here can be edited. Members see only what concerns their subregister, and their own requests rather than other members'.

Code: `src/features/history/HistoryView.jsx`

## Behind the scenes

These parts are not screens. They are listed for developers.

| Where | What it does |
|---|---|
| `src/App.jsx` | Decides which screen and window to show, and holds the logged-in session. |
| `src/api/` | Sends the messages described in the [API guide](api-contract.md). |
| `src/mocks/` | The stand-in server used for testing until the real one exists. It never shows up on screen. |
| `src/shared/ui/` | Reusable buttons, form boxes, pop-up windows, and similar parts. |
