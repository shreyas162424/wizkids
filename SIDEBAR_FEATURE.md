# Collapsible Sidebar Menu Feature

## Overview
A modern, responsive collapsible sidebar menu has been added to the learning screen that enhances the UI with a clean navigation interface. When the sidebar is collapsed, the Krishna chatbot expands to fill more screen space, providing better focus and interaction.

## Features

### 1. **Collapsible Sidebar Menu**
- Located on the left side of the learning screen
- Contains 6 main navigation items:
  - 📊 Dashboard
  - 📈 My Progress
  - 📚 All Topics (active by default)
  - 🏆 Achievements
  - 🔗 Resources
  - ❓ Help & Support

### 2. **Toggle Button**
- Positioned in the top-left corner of the screen
- Shows `←` when sidebar is open
- Shows `→` when sidebar is collapsed
- Smooth rotation animation on toggle
- Accessible and easy to locate

### 3. **Responsive Layout**
The sidebar automatically adapts to different screen sizes:

#### Desktop (1200px+)
- Sidebar: 280px width
- Krishna chatbot: 280px width
- When collapsed, Krishna expands to 420px

#### Tablet (768px - 1199px)
- Sidebar: 240px width
- Krishna chatbot: 280px width
- When collapsed, Krishna expands to 380px

#### Mobile (< 768px)
- Sidebar: 100% width (full screen overlay)
- Properly overlays content with appropriate z-index
- Krishna chatbot scales appropriately

#### Small Mobile (< 480px)
- Sidebar: 100% width with optimized padding
- Compact menu items
- Krishna chatbot: Full width when collapsed

### 4. **Krishna Chatbot Expansion**
When the sidebar is collapsed:
- The `learning-layout` grid expands from `1fr 280px` to `1fr 420px`
- Krishna chatbot takes up more horizontal space
- Better interaction area for the AI assistant
- Smooth transition animation (300ms)

### 5. **Smooth Animations**
- **Sidebar Toggle**: 300ms cubic-bezier animation
- **Button Rotation**: 180deg smooth rotation
- **Content Shift**: Smooth margin-left transition
- **Hover Effects**: Scale and border color changes

## Code Structure

### CSS Classes

#### Main Container Classes
- `.sidebar-container` - Main sidebar wrapper
- `.sidebar-container.collapsed` - Collapsed state
- `.sidebar-toggle-btn` - Toggle button
- `.sidebar-toggle-btn.rotated` - Rotated state

#### Menu Classes
- `.sidebar-menu` - Menu container with scrolling
- `.sidebar-menu-item` - Individual menu item
- `.sidebar-menu-item.active` - Active menu item styling
- `.sidebar-menu-item-icon` - Icon container
- `.sidebar-menu-item-label` - Label text

#### Layout Classes
- `.main-content-with-sidebar` - Content wrapper
- `.main-content-with-sidebar.sidebar-collapsed` - Collapsed state
- `.learning-layout.sidebar-collapsed` - Expanded Krishna layout

### JavaScript Functions

#### Core Functions
```javascript
toggleSidebar()
```
- Toggles the `state.sidebarCollapsed` boolean
- Adds/removes `sidebar-collapsed` class from learning layout
- Triggers a full render

```javascript
selectSidebarItem(itemId)
```
- Handles menu item selection
- Logs the selected item
- Placeholder for future menu routing logic

```javascript
renderSidebarMenu()
```
- Generates the complete sidebar HTML
- Includes header, menu items, and footer
- Returns the full sidebar markup

### State Management
Located in `state` object:
```javascript
sidebarCollapsed: false  // Boolean tracking sidebar state
```

## Usage

### For Students
1. Click the toggle button (← or →) in the top-left corner
2. The sidebar slides in/out smoothly
3. Click any menu item to navigate
4. When sidebar is collapsed, Krishna chatbot expands for better interaction

### For Developers

#### Modify Menu Items
Edit the `renderSidebarMenu()` function:
```javascript
const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard', active: false },
  // Add more items here
];
```

#### Add Menu Item Handlers
Update the `selectSidebarItem()` function to handle different menu selections:
```javascript
function selectSidebarItem(itemId) {
  switch(itemId) {
    case 'dashboard':
      // Handle dashboard navigation
      break;
    case 'progress':
      // Handle progress view
      break;
    // ... etc
  }
}
```

#### Customize Styling
All CSS variables are used for easy customization:
- `--card`: Background color
- `--border`: Border color
- `--text`, `--text-light`: Text colors
- `--primary`, `--gold`: Accent colors
- `--bg-alt`: Alternative background

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to toggle sidebar
- Proper ARIA labels for screen readers

### Visual Indicators
- Active menu item highlighted
- Hover states on all interactive elements
- Clear visual feedback for all actions
- Good color contrast ratios

### Mobile Considerations
- Touch-friendly button sizes (44px minimum)
- Full-screen overlay on mobile prevents accidental clicks
- Proper z-index stacking for modal behavior

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- CSS transitions use GPU-accelerated transforms
- No JavaScript reflows during animation
- Minimal state changes trigger re-renders
- Efficient DOM updates

## Future Enhancements

1. **Persistent State**: Save sidebar preference to localStorage
2. **Keyboard Shortcuts**: Add keyboard shortcuts to toggle
3. **Animations**: Add more sophisticated entrance animations
4. **Mobile Menu**: Drawer-style menu for mobile devices
5. **Search**: Add search functionality in sidebar
6. **Categories**: Organize menu items into collapsible categories

## Troubleshooting

### Sidebar not appearing?
- Check if `renderSidebarMenu()` is called in `render()`
- Verify CSS file is loaded correctly
- Check browser console for errors

### Krishna not expanding?
- Verify `learning-layout` has the `sidebar-collapsed` class
- Check CSS grid values for desktop breakpoint
- Ensure z-index values are correct

### Toggle button not responding?
- Check if `toggleSidebar()` function exists
- Verify onclick handler is properly set
- Check browser console for JavaScript errors

## Files Modified

1. **css/styles.css**
   - Added ~300 lines of CSS for sidebar styling
   - Added responsive breakpoints
   - Added animations and transitions

2. **js/app.js**
   - Added `sidebarCollapsed` to state
   - Added `renderSidebarMenu()` function
   - Added `toggleSidebar()` function
   - Added `selectSidebarItem()` function
   - Updated `renderLearning()` to include sidebar
   - Exported new functions in public API

## Testing Checklist

- [ ] Sidebar opens/closes on button click
- [ ] Toggle button rotates correctly
- [ ] Krishna chatbot expands when sidebar closes
- [ ] Menu items respond to clicks
- [ ] Responsive behavior on tablet size
- [ ] Responsive behavior on mobile
- [ ] Scrolling works in menu
- [ ] Animations are smooth
- [ ] No console errors
- [ ] Touch events work on mobile
- [ ] Keyboard navigation works
- [ ] Visual states are clear

## Related Components

- **Learning Screen**: Main container for sidebar
- **Krishna Chatbot**: Expands when sidebar collapses
- **Header**: Top navigation bar
- **Learning Main Content**: Adjusts when sidebar toggles

---

**Created**: May 26, 2026  
**Last Updated**: May 26, 2026  
**Version**: 1.0
