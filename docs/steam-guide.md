---
title: Putting your game on Steam
permalink: /steam-guide/
---

# Putting your game on Steam

[gamegen](https://github.com/zeveck/gamegen) makes web games: they play in
any browser, on desktop and on phones. With `--package steam`, it also turns
a finished game into apps for Windows and Linux (including Steam Deck), and
makes what Steam asks for. This guide covers the rest: the steps in
Steamworks that only you can do, from your account to the release.

**Expect:** $100 per game, paid to Valve; about two to three weeks from a
finished store page to release (Valve's reviews, and a two-week "Coming
Soon" period); and an afternoon of forms the first time.

## Contents

1. [Package the game](#1-package-the-game)
2. [Set up Steamworks (once)](#2-set-up-steamworks-once)
3. [Create the app](#3-create-the-app)
4. [Make the store page](#4-make-the-store-page)
5. [Upload a build](#5-upload-a-build)
6. [Try it through Steam](#6-try-it-through-steam)
7. [Reviews, Coming Soon, and release](#7-reviews-coming-soon-and-release)
8. [Updates](#8-updates)
9. [Licences and AI](#9-licences-and-ai)
10. [Good to know](#10-good-to-know)

## 1. Package the game

```
/gamegen --package steam
```

On a game you've already made (or add it to a request: `/gamegen a frog
who hops between lily pads --package`). gamegen:

- adds what a desktop game needs: a Quit button, full screen (F11 or
  Alt+Enter switches), and controller support (Steam Deck is a controller);
- builds `dist/windows/<Game>/<Game>.exe` and `dist/linux/<Game>/<game>`,
  and a zip of each;
- tests the Linux build (the Windows one needs a Windows computer: try the
  exe there before uploading);
- makes, in `dist/steam/`: the store images, the store text, the upload
  files, and `STEAM.md`, a checklist of what's left.

To make just an app without Steam: `--package windows` or `--package
linux`. Mac apps aren't made yet: they have to be signed and notarized with
a paid Apple Developer account, on a Mac.

## 2. Set up Steamworks (once)

1. Sign in to [Steamworks](https://partner.steamgames.com/) with your Steam
   account and join the Steamworks program (Steam Direct).
2. Fill in the company or personal details, the bank account Valve pays
   into, and the tax interview. Valve verifies your identity; it can take a
   few days, so start early.
3. Pay the app fee: $100 per game. Valve pays it back once the game has
   earned enough ([Valve's page on the fee](https://partner.steamgames.com/doc/gettingstarted/appfee)).

## 3. Create the app

1. In Steamworks, create the app with the credit from the fee. Steam gives
   it an **app ID**.
2. Under **SteamPipe → Depots**, add two depots: one for Windows and one
   for Linux (set each one's operating system). Each gets a **depot ID**.
3. Under **Installation → General**, add two **launch options**:
   - Windows: executable `<Game>.exe`;
   - Linux: executable `<game>` (the lowercase name `gamegen` printed, such
     as `bloom-hop`).
4. Put the app and depot IDs in your game's `design/STATUS.md`, such as
   `Steam app: 1234560 (Windows depot 1234561, Linux depot 1234562)`, so
   gamegen fills them into the upload files next time.

## 4. Make the store page

gamegen made these in `dist/steam/store/`; upload them in the store page
editor ([Valve's list of assets](https://partner.steamgames.com/doc/store/assets)):

| Image | Size |
|---|---|
| Header capsule | 920 × 430 |
| Small capsule | 462 × 174 |
| Main capsule | 1232 × 706 |
| Vertical capsule | 748 × 896 |
| Library capsule | 600 × 900 |
| Library header | 920 × 430 |
| Library hero (no text) | 3840 × 1240 |
| Library logo (transparent) | 1280 × 720 |
| Screenshots (at least five) | 1920 × 1080 |

Also on the store page:

- **The descriptions**, from `dist/steam/store/description.md`. Check they
  sound like you and say what's fun.
- **The price** (or free), languages, and the controls it supports
  (keyboard, controller).
- **The content survey**, including the disclosure that the game was made
  with AI (see [Licences and AI](#9-licences-and-ai)).
- A trailer is optional, but it helps a lot.

Submit the store page for review. Valve says to allow 3 to 5 business days,
and to submit at least 7 days before you want it to go live
([Valve's review process](https://partner.steamgames.com/doc/store/Review_Process)).

## 5. Upload a build

Uploads use Valve's command-line tool, **SteamCMD**
([download, and Valve's upload guide](https://partner.steamgames.com/doc/sdk/uploading)).

1. **Use a builder account.** Make a separate Steam account for uploading,
   and give it only the permissions it needs in Steamworks (editing app
   metadata and publishing changes to Steam), rather than using your main
   account.
2. **Fill in the IDs** in `dist/steam/scripts/app_build.vdf` and the two
   `depot_*.vdf` files, if gamegen couldn't (replace `STEAM_APP_ID`,
   `STEAM_DEPOT_WINDOWS` and `STEAM_DEPOT_LINUX`).
3. **Upload**, from the game's `dist/steam/scripts/` folder:

   ```
   steamcmd +login <builder account> +run_app_build "$(pwd)/app_build.vdf" +quit
   ```

   The first time, Steam Guard asks for a code; after that the login is
   remembered.
4. The upload **doesn't go live** on its own (`SetLive` is left empty). In
   Steamworks, under **SteamPipe → Builds**, put the new build on a private
   beta branch first (make one under **Branches**, with a password).

## 6. Try it through Steam

Install the game from Steam on the beta branch (in your library, the
game's **Properties → Betas**), on Windows and, if you have one, on a Steam
Deck or a Linux computer. Check it starts, plays with a controller, saves
(quit and start again), and quits.

**Steam Cloud** (optional): to back up saves, turn on Steam Cloud with
**Auto-Cloud** in Steamworks, with these folders (the game's name as it
shows in the app):

- Windows: `%APPDATA%/<Game>/Local Storage/`
- Linux: `~/.config/<Game>/Local Storage/`

## 7. Reviews, Coming Soon, and release

1. **Build review.** Once the store page is approved, put a build on the
   default branch and submit it for review: Valve installs and plays it, and
   checks it matches the store page. Allow at least 7 business days
   ([Valve's release steps](https://partner.steamgames.com/doc/store/releasing)).
2. **Coming Soon.** The store page has to be up as "Coming Soon" for at
   least two weeks before release, so people can wishlist it. Within 14
   days of the date, it can't be changed without asking Valve.
3. **Release.** When both reviews are approved and the date arrives, press
   **Release App** in Steamworks.

## 8. Updates

Make the change, package again, and upload:

```
/gamegen --change make the last level a little easier --package steam
```

gamegen raises the version each time. Upload as in step 5, try it on the
beta branch, then set the build live on the default branch. Updates don't
need another review.

## 9. Licences and AI

- **AI disclosure.** Steam asks whether a game uses AI-generated content,
  and how. A gamegen game does: its art, sound, and code were generated.
  Say so honestly in the content survey.
- **Music and sound.** Audio made on ElevenLabs' free plan can't be used
  commercially. If you sell the game (or might), remake the audio on a paid
  plan first: gamegen's `STEAM.md` says if this applies.
- **Fonts.** gamegen bundles fonts with their licence files; the ones it
  uses (such as OFL fonts) allow commercial games.
- **Your own content.** gamegen makes original games, but check nothing in
  yours borrows a name, character, or logo from someone else's.

## 10. Good to know

- **Size.** Each build is about 300 MB unzipped (most of it is the
  Electron runtime, the same for every game).
- **Steam Deck.** A gamepad-ready game usually runs well on Steam Deck,
  natively with the Linux build. Valve tests games for its "Deck Verified"
  badge itself; the screen is 1280 × 800.
- **The Steam overlay** (Shift+Tab) may not show up in an Electron game.
  The game works the same without it; achievements and other Steam features
  aren't added yet.
- **Testing a build yourself** before Steam: unzip `dist/<game>-windows.zip`
  on a Windows computer and run the exe.

---

This guide comes with [gamegen](https://github.com/zeveck/gamegen). Steam's
rules change from time to time; Valve's
[Steamworks documentation](https://partner.steamgames.com/doc/home) is the
final word.
