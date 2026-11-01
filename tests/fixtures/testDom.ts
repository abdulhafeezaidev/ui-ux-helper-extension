/**
 * Test fixture constructing a representative DOM tree for extractor tests.
 */
export function setupTestDom(): HTMLElement {
  document.body.innerHTML = `
    <div id="app-root" style="display: block; padding: 20px; margin: 10px; color: rgb(30, 41, 59);">
      <!-- Metadata tags to be filtered out -->
      <script>console.log('metadata script');</script>
      <style>.dummy { color: red; }</style>

      <h1 id="main-title" style="margin-bottom: 16px; font-size: 24px;">UI/UX Inspection Engine</h1>
      <p id="intro-p" style="color: inherit; margin-bottom: 20px;">
        Test paragraph demonstrating inherited text color.
      </p>

      <div id="flex-container" style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 24px;">
        <button id="action-btn" role="button" style="background-color: rgb(139, 92, 246); color: rgb(255, 255, 255); padding: 10px 18px; border-width: 2px; border-style: solid; border-color: rgb(124, 58, 237); border-radius: 6px; border-top-left-radius: 6px; box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); opacity: 0.95;">
          Click Me
        </button>
      </div>

      <div id="grid-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div id="card-1" class="card" style="background-color: rgb(255, 255, 255); padding: 16px; border: 1px solid rgb(226, 232, 240); border-radius: 8px; box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);">
          <h2 id="card-heading" style="font-size: 18px;">Card Title</h2>
          <span id="card-badge" style="display: inline-block; padding: 4px 8px; border-radius: 4px;">Badge</span>
        </div>
      </div>

      <!-- Hidden Element -->
      <div id="hidden-box" style="display: none;">
        <span>Hidden content node</span>
      </div>
    </div>
  `;

  return document.getElementById('app-root')!;
}
