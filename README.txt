MICKEY MILLIGANS BILLIARDS — CLEAN WEBSITE STRUCTURE
====================================================

FOLDER STRUCTURE
----------------
Mickey_Milligans_Billiards_Clean_Structure/
├── index.html
├── about.html
├── tables-rates.html
├── events.html
├── leagues.html
├── contact.html
├── components/
│   └── site-header.js
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── images/
└── assets/

HOW THE SHARED MENU WORKS
-------------------------
Every page contains:

<site-header></site-header>

and, immediately before </body>:

<script src="components/site-header.js"></script>
<script src="js/script.js"></script>

The navigation itself is stored only in:

components/site-header.js

To change a menu label, page link, logo text, or phone number across the
entire website, edit that one file.

IMPORTANT
---------
Keep every HTML page in the main website folder exactly as shown above.
Do not move individual pages into separate About, Leagues, or Tables folders.
That is what caused the relative file paths to break.

LOCAL PREVIEW
-------------
Open the entire folder in VS Code, then use Live Server on index.html.
You may also open index.html directly, but Live Server is recommended.

ADDING YOUR LOGO
----------------
The component currently uses the styled Mickey Milligans text logo.

To use your image logo:
1. Put the logo in the images folder as logo.png.
2. Open components/site-header.js.
3. Replace the text-logo HTML with:

<a class="logo" href="index.html">
  <img src="images/logo.png" alt="Mickey Milligans Billiards">
</a>

4. Add this to css/styles.css:

.logo img {
  display: block;
  max-width: 220px;
  height: 64px;
  object-fit: contain;
}
