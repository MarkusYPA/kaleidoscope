# Kaleidoscope

"A web page that looks like staring into a kaleidoscope. There will be some colorful shapes tumbling around in a square or something and a view of that will be cropped to a triangle. That triangle will then be mirrored many times over to cover the screen."

## High-level goal (to anchor decisions)

* One **rotating square container** with tumbling colorful shapes (Matter.js) — think "laundry machine" or "cement mixer"
* That square is **sampled, clipped to a triangle**
* The triangle is **mirrored + rotated** to fill the screen like a kaleidoscope
* Physics and visuals are **decoupled**

---

## Step-by-step implementation plan

### **Step 1 — Project setup (keep it boring & flexible)**

* Plain HTML + JS to start (no framework yet)
* One `<canvas>` element that fills the screen
* Import:

  * `matter.js`
* Use ES modules if you can (future-you will thank you)

**Why:** fewer moving parts while you’re experimenting.

---

### **Step 2 — Create the physics “texture” canvas**

* Create an **offscreen canvas** (or hidden one)

  * Square: e.g. `512 × 512` or `1024 × 1024`
* This canvas is *never* shown directly
* All physics rendering goes here

**Key idea:**
This canvas is your kaleidoscope *source texture*.

---

### **Step 3 — Initialize Matter.js with a Rotating Container**

* Create:

  * `Engine`
  * `World`
  * `Runner`
* Enable Gravity:
  * Gravity should pull **down** relative to the screen (so things fall to the bottom).
* Create a **Rotating Container**:
  * Four walls forming a square Box.
  * These walls must **rotate** around the center of the canvas over time.
  * This rotation effectively "tumbles" the shapes inside (like a dryer or cement mixer).

**Implementation Note:**
* You can't just use `isStatic: true` if you want them to push bodies while rotating.
* Use `Matter.Body.setAngle` in the animation loop to rotate the walls.
* Ensure the walls have high friction so they "grab" the particles and lift them up.

---

### **Step 4 — Add tumbling bodies**

* Spawn a small number of bodies (5–20 max)
* **Crucial:** Spawn them *inside* the rotating container walls!
* Mix:

  * Polygons (triangles, hexes)
  * Circles
* Randomize:

  * Size
  * Initial rotation
  * Angular velocity
  * Color

**Physics tuning**

* High restitution (bouncy)
* High friction (to catch the rotating walls)
* Slight air resistance

This is where the “alive” feeling comes from — the machine grabs them and tosses them.

---

### **Step 5 — Switch to custom rendering (important pivot)**

Once things move nicely:

* Stop using `Matter.Render`
* On every animation frame:

  * Clear the offscreen canvas
  * Loop through `engine.world.bodies` (excluding the invisible container walls if you prefer, or draw them for debug)
  * Draw shapes manually using:

    * `ctx.save()`
    * `ctx.translate(body.position)`
    * `ctx.rotate(body.angle)`
    * `ctx.restore()`

**Why this matters**

* Full control over:

  * Color gradients
  * Stroke styles
  * Glow / blur
  * Trails / alpha fade
* Matter becomes *pure motion logic*

---

### **Step 6 — Build the triangle mask**

* Decide on triangle shape:

  * Equilateral triangle is classic kaleidoscope
* Create a **triangle clipping path** on the main canvas:

  ```js
  ctx.beginPath()
  ctx.moveTo(...)
  ctx.lineTo(...)
  ctx.lineTo(...)
  ctx.closePath()
  ctx.clip()
  ```
* Draw the **offscreen canvas** into that clipped region.
* **Note:** You are sampling from the *physics canvas*. Since the physics world has a rotating box, your "texture" is now a view of that box spinning and tumbling its contents.

You now have **one triangle view** into your physics world.

---

### **Step 7 — Mirror the triangle**

* Wrap triangle drawing in a function:

  ```js
  drawTriangle(x, y, rotation, mirror)
  ```
* Use:

  * `ctx.translate`
  * `ctx.rotate`
  * `ctx.scale(-1, 1)` for mirroring
* Draw the same triangle multiple times around a center point

**Classic kaleidoscope pattern**

* 6, 8, or 12 slices
* Alternate mirrored / non-mirrored slices

---

### **Step 8 — Tile across the screen**

Your goal is to fill the screen.

**Option A — Radial kaleidoscope**

* One large center point in the middle of the screen.
* The kaleidoscope expands outward.

**Option B — Tiled kaleidoscope**

* Repeat the kaleidoscope "flower" in a grid.
* Each tile samples the *same* physics texture (the laundry machine).

Your description implies **Option A** (Triangle mirrored to cover the screen).

---

### **Step 9 — Resize handling**

* On window resize:

  * Resize main canvas
  * Recalculate triangle geometry
* Keep physics canvas size fixed
  (this avoids reinitializing Matter.js)

---

### **Step 10 — Visual polish pass**

Now the fun stuff ✨

Ideas:

* Fade trails (draw a translucent rect each frame instead of clearing)
* slowly rotate the entire kaleidoscope *optics layer* (in addition to the physics rotation)
* Color cycling (HSV rotation)
* Subtle zoom in/out
* Occasional body spawn / removal

---

### **Step 11 — Performance sanity check**

* Cap body count
* Avoid per-pixel operations
* Reuse paths where possible
* Test on a phone early (trust me)

---

## Mental model to keep you sane

Think in **layers**:

1.  **Physics layer**
    Matter.js → Rotating container + tumbling bodies (The "Machine")

2.  **Texture layer**
    Offscreen canvas → A 2D view of the machine working.

3.  **Optics layer**
    Triangles, mirroring, rotation → The logic that takes a slice of the texture and makes it infinite.

Never mix responsibilities between them.

---

## If you want next

We can:

* Sketch exact triangle math (angles & mirroring rules)
* Write a *minimal* starter scaffold
* Design a really nice color system (this matters a lot visually)

Just tell me where you want to zoom in 🔍✨
