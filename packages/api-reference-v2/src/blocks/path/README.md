# Scalar Path

- A path summary <section> element.

```html
<section class="t_reference__path" id="<path>">
  <div class="t-reference__path-summary">
    <h2>Path Name</h2>
    <button aria-controls="<path>/operations" />
    <!-- Path summary content -->
  <div>
  <div id="<path>/operations" aria-expanded="false">
    <!-- Slot for operations on that path -->
    <slot />
  </div>
</section>

```