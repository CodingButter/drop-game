# The Drop Game Mechanics and Features

The Drop Game, also called **Parachute Drop**, was created by **Instafluff and Maaya** of PixelPlush during Twitch’s **Channel Points Hackathon in 2021**. It started as a simple game where viewers type `!drop` in chat, and their avatar falls onto a platform. Since then, it has evolved with power-ups, physics effects, and obstacles.

## How the Game Works

- Viewers type `!drop`, and their avatar (a Twitch emote or custom character) parachutes down.
- The goal is to land as close to the center of the **target platform** as possible.
- Avatars bounce off each other and off obstacles, making the landing **chaotic**.
- Points are awarded based on **landing accuracy**—closer to the center means higher points.
- **Leaderboards** track top scores over the last 24 hours or by session.
- Viewers can check scores using commands like `!droptop`, `!droplow`, and `!droprecent`.

## Commands and Settings

### Main Commands

- `!drop` – Drops the viewer’s avatar.
- `!droptop` – Shows the highest-scoring landing.
- `!droplow` – Shows the worst landing.
- `!droprecent` – Lists the most recent drop scores.

### Moderator/Admin Commands

- `!queuedrop [seconds]` – Starts a queue for group drops.
- `!startdrop` – Triggers all queued drops at once.
- `!resetdrop` – Resets or cancels the current game.

Some versions also allow **customization** of these commands, and drops can even be triggered by **Twitch Channel Points** instead of commands.

## Power-Ups and Special Features

Several versions of the game include **power-ups** and extra mechanics:

- **Bombs**: Push away other avatars mid-air.
- **Bouncing obstacles**: Extra objects that avatars can hit and ricochet off.
- **Collision Resistance**: Prevents an avatar from bouncing off others.
- **Parachute Cut**: Some versions let players cut their parachute mid-air to drop faster.
- **Themed backgrounds & avatars**: Players can use **custom avatars**, Twitch emotes, or special items from PixelPlush.

## Scoring and Variations

- **Points** are based on distance from the bullseye.
- The **best landing** is recorded on a leaderboard, often reset **daily**.
- **Group Drop Mode**: Instead of dropping individually, all queued players drop at the same time.
- **Cut Parachute Mode**: Some versions allow users to manually drop faster, adding **skill-based elements**.

## Twitch Integration

- The game runs as a **browser source** in **OBS or Streamlabs OBS**.
- Streamers authorize their Twitch account via the **PixelPlush website** (or self-host a custom version).
- The game reads **chat messages** and triggers drops based on `!drop` commands.
- **Twitch Channel Points** can be used to trigger drops or power-ups.
- It works **in real-time**, so viewers see their parachutes appear almost instantly.

### Engagement Benefits

- Converts **passive viewers** into **active participants**.
- Encourages **repeat visits** as people try to beat their previous scores.
- Works as a **fun side-game** during stream downtime.
- Can be used for **prizes or special events** (e.g., “Bullseye Challenge” for a giveaway).

## Popular Streamers and Usage

- **Instafluff** (co-creator) showcased it on stream with **real-time audience feedback**.
- **LoneJedi70** customized commands in another language for his community.
- **VTubers** frequently use it with **themed avatars**.
- **Event streamers** use it for **giveaways and milestones**.
- Twitch even recognizes it as an **official game category** ("Parachute Drop").

## Technical Setup

To run **The Drop Game**, streamers need:

- **OBS or Streamlabs** (or any software that supports **browser sources**).
- A **hosted overlay** (PixelPlush’s version or self-hosted alternatives).
- **Twitch API authentication** to read chat messages.

### Versions Available

- **PixelPlush Official Version** – Easy to set up, feature-rich.
- **OdatNurd’s "Stream Dropper"** – Open-source, self-hosted, includes a parachute-cut mechanic.
- **Haliphax’s Drop Game Clone** – Built with **Phaser 3**, Twitch bot included, runs entirely **in-browser**.

## Performance & Customization

- Uses **minimal CPU/GPU resources** since it’s **web-based**.
- Can be **customized** with themes, command names, and physics settings.
- Some versions allow **channel point integration**, requiring **no chat commands**.

## Statistics & Popularity

- **Hundreds** of Twitch channels use the game **regularly**.
- **PixelPlush has leaderboards** per channel, showing **active use**.
- **Twitch chat metrics** show increased engagement when the game is active.
- The game is frequently mentioned in **Twitch forums & streamer communities**.
- **YouTube tutorials** exist, showing how to **set it up and use it effectively**.

## Similar Twitch Chat Games

If you’re interested in other **Twitch chat games**, here are some worth checking out:

- **Marbles on Stream** – A chat-controlled **marble race**.
- **Stream Avatars** – Interactive **2D avatars** that can battle, jump, or race.
- **Stream Animals** – Mini-games, including a **parachute drop mode**.
- **PixelPlush Plinko Bounce** – A gravity-based **Pachinko-style game**.
- **Words on Stream** – A **word puzzle** game controlled by chat.
- **Twitch Plays-style games** – Games where the **entire chat controls gameplay**.

## Final Thoughts

**The Drop Game** has become a **Twitch staple**, blending **luck, chaos, and competition** into an interactive experience. Whether used casually or as a **competitive event**, it’s a great way to keep **chat active and engaged**. The **multiple implementations** (PixelPlush, self-hosted versions) mean that streamers can **choose** the one that best fits their needs.

It’s **easy to set up**, doesn’t require extra software, and **enhances community interaction**, making it a **valuable tool** for streamers looking to boost **engagement**.
