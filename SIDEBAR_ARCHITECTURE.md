# Sidebar Architecture & Implementation Details

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Screen Header (56px)                                       │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐                                                 │
│ │  Toggle  │  ┌─────────────────────────────────────────┐  │
│ │  Button  │  │  Learning Main Content                  │  │
│ │  ← or →  │  │                                         │  │
│ ├──────────┤  │  .learning-layout                       │  │
│ │          │  │  ┌───────────────────────────────────┐  │  │
│ │ Sidebar  │  │  │ Content                           │  │  │
│ │ Menu     │  │  │ (Concept/Game)                    │  │  │
│ │          │  │  │                                   │  │  │
│ │          │  │  │ .learning-main                    │  │  │
│ │          │  │  │ (1fr width)                       │  │  │
│ │          │  │  └───────────────────────────────────┘  │  │
│ │          │  │  ┌───────────────────────────────────┐  │  │
│ │          │  │  │ Krishna Chatbot                   │  │  │
│ │          │  │  │ (280px → 420px when collapsed)    │  │  │
│ │          │  │  │                                   │  │  │
│ │          │  │  │ .ai-sidebar                       │  │  │
│ │          │  │  │ (280px / 420px width)             │  │  │
│ │          │  │  └───────────────────────────────────┘  │  │
│ │          │  └─────────────────────────────────────────┘  │
│ │          │                                                 │
│ └──────────┘                                                 │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### State Variables
```javascript
state = {
  // ... existing state ...
  sidebarCollapsed: false  // ← NEW: Tracks sidebar open/closed state
}
```

### State Transitions
```
Initial State: sidebarCollapsed = false (sidebar open)
                    ↓
            User clicks toggle button
                    ↓
        toggleSidebar() function called
                    ↓
        state.sidebarCollapsed = !state.sidebarCollapsed
                    ↓
            render() called
                    ↓
        renderSidebarMenu() generates HTML
        renderLearning() applies state classes
                    ↓
        CSS animations trigger:
        - Sidebar slides left/right
        - Button rotates 180°
        - Krishna expands/contracts
```

## CSS Grid System

### Default (Sidebar Open)
```css
.learning-layout {
  display: grid;
  grid-template-columns: 1fr 280px;  /* Content (1fr) + Krishna (280px) */
  min-height: calc(100vh - 120px);
}
```

### Collapsed (Sidebar Closed)
```css
.learning-layout.sidebar-collapsed {
  grid-template-columns: 1fr 420px;  /* Content (1fr) + Expanded Krishna (420px) */
}
```

**Grid Calculation:**
- `1fr` = Flexible width for main learning content
- `280px` → `420px` = Krishna sidebar width change (140px expansion)
- Smooth transition via CSS transition property

## Component Structure

### 1. Toggle Button
```
Location: Fixed position, top-left of screen
Classes: .sidebar-toggle-btn, .sidebar-toggle-btn.rotated
Events: onclick="GKApp.toggleSidebar()"
States: 
  - Open: ← arrow, rotation 0°
  - Closed: → arrow, rotation 180°
```

### 2. Sidebar Menu
```
Structure:
  .sidebar-container
    ├── .sidebar-header
    │   └── .sidebar-title ("📚 Menu")
    ├── .sidebar-menu
    │   ├── .sidebar-menu-item (Dashboard)
    │   ├── .sidebar-menu-item (Progress)
    │   ├── .sidebar-menu-item (Topics) [active]
    │   ├── .sidebar-menu-item (Achievements)
    │   ├── .sidebar-menu-item (Resources)
    │   └── .sidebar-menu-item (Help)
    └── .sidebar-footer
        └── .sidebar-footer-btn ("← Collapse")
```

### 3. Content Area
```
Structure:
  .screen-content-col (.main-content-with-sidebar)
    └── .learning-wrap
        ├── .learning-topbar
        │   ├── Back button
        │   ├── Progress dots
        │   └── Topic name
        └── .learning-layout
            ├── .learning-main (1fr)
            │   └── [Content Card]
            └── .ai-sidebar (280px/420px)
                └── [Krishna Chatbot]
```

## Animation Timeline

### Toggle Sidebar Animation (300ms)
```
t=0ms       User clicks toggle button
├─ toggleSidebar() called
├─ state.sidebarCollapsed flipped
└─ render() triggered

t=16ms      First paint requested
├─ DOM updated with new classes
├─ CSS receives new values
└─ Browser prepares animations

t=0-300ms   Animations execute
├─ .sidebar-container:
│  └─ transform: translateX(-100%) / translateX(0)
├─ .sidebar-toggle-btn:
│  └─ rotate(180deg) / rotate(0deg)
├─ .learning-layout:
│  └─ grid-template-columns: 1fr 280px → 1fr 420px
└─ Krishna area width changes smoothly

t=300ms     Animation complete
├─ Final state reached
├─ All elements in place
└─ Ready for user interaction
```

## CSS Timing Functions

```css
/* Main animations use cubic-bezier for smooth easing */
cubic-bezier(0.4, 0, 0.2, 1)

/* Easing curve visualization:
   Start: 0.4    → Fast acceleration
   Early: 0      → Linear middle section
   Late: 0.2     → Begins deceleration
   End: 1        → Reaches exactly at 100%
*/

/* Equivalents:
   - Material Design standard easing
   - Perceived as natural and smooth
   - Professional appearance
*/
```

## Responsive Design Cascade

```
Desktop (1200px+)
├─ Sidebar: 280px
├─ Krishna: 280px (open) → 420px (closed)
└─ Layout: Side-by-side optimal

Tablet (768px - 1199px)
├─ Sidebar: 240px
├─ Krishna: 280px (open) → 380px (closed)
└─ Layout: Side-by-side with tighter spacing

Mobile (< 768px)
├─ Sidebar: 100% full-screen overlay
├─ Krishna: 100% full-width
├─ Layout: Stacked
└─ Toggle button: Always visible, z-index: 1001

Small Mobile (< 480px)
├─ Sidebar: 100% with compact padding
├─ Menu items: Smaller font (0.9rem)
├─ Toggle button: Smaller (40px)
└─ Layout: Optimized for thumb navigation
```

## Event Flow Diagram

```
User Interaction
      ↓
Click Toggle Button (.sidebar-toggle-btn)
      ↓
onclick="GKApp.toggleSidebar()"
      ↓
toggleSidebar() {
  ├─ state.sidebarCollapsed = !state.sidebarCollapsed
  ├─ document.querySelector('.learning-layout')
  │  └─ classList.toggle('sidebar-collapsed')
  └─ render()
}
      ↓
render() function executes
      ↓
renderLearning() generates HTML
      ├─ renderSidebarMenu() → Sidebar HTML
      ├─ renderHeader() → Header
      ├─ _agentHtml() → Krishna
      ├─ mainContent → Learning content
      └─ Applies classes based on state.sidebarCollapsed
      ↓
Browser updates DOM
      ↓
CSS transitions trigger
      ├─ Sidebar slides: transform translateX
      ├─ Button rotates: transform rotate
      └─ Grid expands: grid-template-columns
      ↓
Animation completes after 300ms
      ↓
Final state rendered
```

## Z-Index Stacking Context

```
z-index: 10000  → .dhyana-close-btn (fullscreen mode close)
z-index: 9999   → Modal in fullscreen Krishna
z-index: 9998   → Fullscreen backdrop
z-index: 1101   → .sidebar-toggle-btn (always accessible)
z-index: 1100   → .sidebar-container (on mobile)
z-index: 1001   → .sidebar-toggle-btn (on desktop)
z-index: 1000   → .sidebar-container (on desktop)
z-index: 2      → .agent-avatar-wrap
z-index: 1      → .agent-speech-bubble
z-index: 0      → Default elements
```

## Performance Optimization

### GPU Acceleration
```css
/* Using transform instead of position changes */
.sidebar-container {
  transform: translateX(-100%);  /* ✓ GPU accelerated */
  transition: transform 0.3s;
}

/* Instead of: */
.sidebar-container {
  left: -280px;  /* ✗ Not GPU accelerated */
  transition: left 0.3s;
}
```

### Layout Stability
```css
/* Prevent layout shifts */
.main-content-with-sidebar {
  transition: margin-left 0.3s;  /* Smooth but no layout reflow */
}

/* Only affects margin, not layout flow */
```

### Rendering Optimization
- Sidebar HTML generated once per render
- CSS classes toggle via classList API
- No inline style changes during animation
- Minimal DOM recalculations

## Browser Compatibility

```
Chrome/Edge 90+       ✓ Full support (transform, grid, transitions)
Firefox 88+           ✓ Full support
Safari 14+            ✓ Full support (needs -webkit prefixes for old versions)
iOS Safari 14+        ✓ Full support
Chrome Mobile 90+     ✓ Full support
Edge Mobile 18+       ✓ Full support
```

## Future Architecture Considerations

### 1. State Persistence
```javascript
// Could save to localStorage
localStorage.setItem('gk_sidebar_collapsed', state.sidebarCollapsed);
```

### 2. Keyboard Navigation
```javascript
// Could add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') GKApp.toggleSidebar();
});
```

### 3. Advanced Animations
```css
/* Could add entrance animations */
@keyframes slideInSidebar {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### 4. Mobile Drawer
```javascript
// Could implement SwipeGesture listener for mobile
onSwipeLeft: () => GKApp.toggleSidebar();
```

## Testing Checklist

```
□ Toggle button functionality
  □ Click opens sidebar
  □ Click closes sidebar
  □ Animation smooth (60fps)
  □ Button rotates correctly

□ Sidebar interaction
  □ Menu items clickable
  □ Scrolling works
  □ Footer button collapses

□ Krishna expansion
  □ 280px → 420px desktop
  □ 280px → 380px tablet
  □ Full-width mobile

□ Responsive behavior
  □ Desktop layout
  □ Tablet layout
  □ Mobile overlay
  □ Small mobile

□ Cross-browser
  □ Chrome
  □ Firefox
  □ Safari
  □ Mobile browsers

□ Performance
  □ Animations smooth
  □ No jank/stuttering
  □ CPU usage low
  □ Memory stable
```

---

**Architecture Version**: 1.0  
**Last Updated**: May 26, 2026  
**Complexity**: Medium  
**Maintainability**: High
