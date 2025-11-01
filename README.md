# Building fantastic form with Drumee

This is a real use case of using Drumee extensibility. [Checkout the live implementation](https://onboarding.drumee.org/onboarding.html)

## The frontend
### Project structure

Drumee Rendering Engine is based on MVC design pattern. Refere to [Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) if you are not familiar with this concept. 

Drumee frontend library is a client side rendering engine. It's fully based on JSON data to bring to live th User Interface. In general, there no need to write HTML in your code, which make it much easier to red and maintain.

```
index.html <= Initial loader. Get the Drumee rendering engine, LETC, [checkout demo](https://drumee.com/-/#/sandbox/)
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
   ├── seeds.js <= Custom wigets map. This the Drumee Magic!
   ├── skeleton <= Main widget DOM 
   │   ├── done.js
   │   ├── index.js
   │   └── toolkit
   ├── skin  <= Main widget styles
   │   ├── done.scss
   │   ├── form.scss
   │   ├── index.scss
   │   └── vars.scss
   └── widget <= Custom wigets
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
   └─── widget <= Custom wigets
       ├── menu-input
       └── ruler-slider

```

In this example, the Controlers are **main**, **widget/menu-input** and **widget/ruler-slider**.
The live cycle of a Drumee WIdget are:

Their kinds as known by the 
 on provides Basic UI tookits. Their Namespace is Skeletons.* They are intended to provide JSON data to be feed into the  
