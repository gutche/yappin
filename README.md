# Yappin 🗣 🗣 🗣

Yappin is an modern messaging app built with the **Vue framework**. It uses the **Socket.IO** library for bidirectional and low-latency communication.

## Purpose

This app is being developed solely for educational purposes. I'm just trying out different frameworks and sockets (Vue and SocektIO) and figuring out how messaging apps work.

## Live demo

You can check out a working demo of the app [here](https://yappin.vercel.app/).

Tip: the id on the left panel is what your friend would need, to add you as a friend. To test the messaging features by yourself, you'll have to open the app in a private window and register another account. This way you are logged in as two different users.

Please note that every cloud service needed to run this app is running on free tier so I'll have to wipe its data once in a while.

---

## Features

-   **Real-time messaging** with low latency
-   **Redis caching** for recent messages and event propagation

---

## Screenshot

Here’s a preview of how Yappin looks:

![Yappin screenshot](screenshots/image.png)

---

## What's Next

-   Encrypt messages
-   Add emojis
-   Add voice messages
-   Ability to send images or videos

## Technologies Used

-   **Frontend**: Vue.js, Vite
-   **Backend**: Express, Socket.IO
-   **Database**: Redis, PostgreSQL
-   **Development**: Docker
-   **Media management service**: Cloudinary

---

## License

[MIT](./LICENSE)
