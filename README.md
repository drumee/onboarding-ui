# Building fantastic form with Drumee

This is a real use case of using Drumee extensibility.

## The frontend
### Project structure

Drumee Rendering Engine is based on MVC design pattern. Refer to [Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) if you are not familiar with this concept. 

Drumee frontend library is a client side rendering engine. It's fully based on JSON data to bring the user interface to life. In general, there no need to write HTML in your code, which make it much easier to read and maintain.

```
index.html <= Initial loader. Get the Drumee rendering engine, LETC
   app/
   ├── index.js <= App loader. It's triggered once Drumee Rendering Engine is fully loaded
   ├── main.js  <= App app entry point. 
   ├── locale
   │   ├── index.js 
   │   ├── en.json
   │   ├── es.json
   │   ├── fr.json
   │   ├── km.json
   │   ├── ru.json
   │   └── zh.json
   ├── seeds.js <= Custom widgets map. This the Drumee Magic!
   ├── skeleton <= Main widget DOM 
   │   ├── done.js
   │   ├── index.js
   │   └── toolkit
   ├── skin  <= Main widget styles
   │   ├── done.scss
   │   ├── form.scss
   │   ├── index.scss
   │   └── vars.scss
   └── widget <= Custom widgets
       ├── menu-input
       │   ├── index.js
       │   ├── skeleton
       │   │   └── index.js
       │   └── skin
       │       └── index.scss
       └── ruler-slider
           ├── index.js
           ├── seeds.js
           ├── skeleton
           │   └── index.js
           └── skin
               └── index.scss
   └─── widget <= Custom widgets
       ├── menu-input
       └── ruler-slider

```

In this example, the Controllers are **main**, **widget/menu-input** and **widget/ruler-slider**.

## Widgets

Custom widgets are registered through `app/seeds.js` — that map is what makes a
widget available to the skeleton trees. Each widget follows the same shape:

```
widget/<name>/
├── index.js      Controller
├── skeleton/     The JSON component tree
└── skin/         Styles
```

The basic building blocks come from the `Skeletons.*` namespace: they take JSON
and produce the rendered interface, so there is no HTML to write.

## Development

```console
npm install
npm run dev        # development server
npm run stage      # staging build
npm run deploy     # production build and deploy
npm run add-widget # scaffold a new widget
```

## Related

[onboarding-server](https://github.com/drumee/onboarding-server) — the services
behind this interface.

## Contributing

See the org [CONTRIBUTING guide](https://github.com/drumee/.github/blob/main/CONTRIBUTING.md).
Questions: [Discussions](https://github.com/orgs/drumee/discussions).

## License

Apache-2.0 — see [LICENSE](LICENSE).
