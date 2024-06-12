# Seqoio

Seqoio is a dynamic online document made for individuals and teams.

The name Seqoio is derived from sequoia, the gigantic trees. The core technology of Seqoio is a tree datastructure around which value creation evolves. The first incarnation is a collaborative tree document for brainstorming, todo tracking and problem solving.

Everything starts with a cursor on a blank canvas. Typing words creates the first node. With the same keyboard commands as a normal text editor, structure evolves from the void.

The color of Seqoio is cyan which is a mixture of green and blue. The green components represents the natural tree whereas the blue component represents the technical aspect.

## Server

To run Seqoio server, the following steps are required:

1. Start a mongo DB via docker:

```
docker run -p 27017:27017 -d mongo
```

2. Build the client Single Page Application (SPA):

```
cd client
npm install
npm run build
```

3. Run the server:

```
cd server
npm start
```

4. Open http://localhost:3000


## Docker

To run the Seqoio server in Docker instead of natively, simply run this:

```
docker-compose -f ./docker-compose.yml up -d --build --force-recreate
```

## Authentication

Authentication is done via passport.js and currently supports local (email+password), OpenID Connect (Microsoft, Google).

Once authenticated, a Json Web Token (JWT) is set as cookie to authenticate the user for further requests. From that point on, the single page application endpoint can be accessed.

The app root is protected only on `/` and `/index.html`, all other accesses are passed through. This is done to allow serving static assets from this location. So far it's not a security issue because it only serves as a redirect to sign-in if user is not signed-in and the front-end requests are all secured separately.

## Logging

Logging is done through bunyan allowing structured logging as JSON. The server is started with bunyan CLI to have a pretty printed debug console.


## Design

Seqoio has a clean, reduced architectureal design language with few but bright accent colors. Primary, secondary and tertiary colors are:

```
        Normal  Light   Dark
Cyan    #29D4FF #66E0FF #00B7E5
Magenta #FF297F #FF66A3 #E5005C
Yellow  #FFD429 #FFE066 #E5B700
```

Note: In browser, the colors might be rendered slightly different depending if operating system and/or browsers are not set to sRGB color space. For Google Chrome, the space can be set here chrome://flags/#force-color-profile. Also note that Affinity Designer might export colors differently to SVG.
