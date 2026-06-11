# Third-Party Licenses

This file lists copy-and-own assets in the Gateway repository that
originate from third-party projects, along with the upstream license
terms. The repository's primary code is covered by the [MIT License](./LICENSE);
the entries below add the obligations of each individual asset.

For runtime npm dependencies, see `frontend/package.json` and the
licenses bundled by each package; this file only covers assets that
were copied into the repository (textures, SVG markup, etc.) rather
than installed via a package manager.

---

## Three.js — `frontend/public/stage/world/water-normal.jpg`

The water normal map is adapted from
`examples/textures/waternormals.jpg` in the [three.js](https://github.com/mrdoob/three.js)
project (MIT license). It is used as the surface-perturbation
texture by the WebGL water shader.

- Upstream file: <https://github.com/mrdoob/three.js/blob/dev/examples/textures/waternormals.jpg>
- Upstream license: <https://github.com/mrdoob/three.js/blob/dev/LICENSE>

```
The MIT License

Copyright © 2010-2025 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

## Phosphor Icons — `frontend/src/components/world/lifebuoy.tsx`

The lifebuoy SVG used by the loading scrim is adapted from the
[Phosphor Icons](https://github.com/phosphor-icons/core) project
(`lifebuoy-duotone`, MIT license). It is recoloured (white ring +
warm-amber stripes) and animated with GSAP, but the underlying path
geometry is upstream.

- Upstream file: <https://github.com/phosphor-icons/core/blob/main/assets/duotone/lifebuoy-duotone.svg>
- Upstream license: <https://github.com/phosphor-icons/core/blob/main/LICENSE>

```
MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Brand marks — GitHub, LinkedIn, YouTube

The contact-section and deck-card icons for GitHub, LinkedIn, and
YouTube are hand-traced reproductions of each platform's logo, used
solely as directional link icons pointing to those platforms. The
marks remain trademarks of their respective owners. Usage follows
each platform's public brand guidelines.

- GitHub brand resources: <https://github.com/logos>
- LinkedIn brand resources: <https://brand.linkedin.com>
- YouTube brand resources: <https://www.youtube.com/howyoutubeworks/resources/brand-resources/>
