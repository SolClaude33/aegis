# Cyberpunk Crypto Trading Dashboard Design Guidelines

## Design Approach
**Reference-Based Approach**: Inspired by the NSDEX interface with a dark cyberpunk aesthetic creating an immersive high-tech command center experience.

## Core Design Elements

### Color Palette
- **Background**: #0a0a1a to #1a1a2e gradient
- **Primary Neon**: #00d4ff, #0099ff  
- **Success/Buy**: #00ff88
- **Danger/Sell**: #ff0044
- **Text**: #ffffff with 0.9 opacity
- **Accent Gold**: #ffd700

### Typography
- **Primary Headers**: "Orbitron" or "Share Tech Mono"
- **Body Text**: "Roboto Mono"
- **All text**: Subtle text-shadow glow effects

### Layout System
**CSS Grid Structure**: Header (full width) | Left Sidebar (20%) | Main Content (60%) | Right Sidebar (20%) | Footer (full width)

## Component Library

### Header Bar
- Retro terminal styling with "Welcome to my Cyber realm" text
- ASCII art decorative borders
- Glowing blue text effects

### Left Sidebar
- Navigation panel with glowing hover effects
- Status indicators with pulsing animations
- Live market ticker with scrolling text
- Meme corner with rotating image placeholders

### Main Content Area
- Large trading chart with animated candlesticks placeholder
- Real-time price display with number animations
- Buy/Sell buttons with neon glow effects
- Market sentiment indicator with animated gauge
- Latest updates feed with typewriter text effect

### Right Sidebar
- User profile card with avatar placeholder
- Portfolio pie chart (animated on load)
- Top traders leaderboard with rank animations
- Social feed with sliding panel transitions

## Special Effects & Interactions
- **Scanline overlay**: Across entire screen for CRT monitor effect
- **Glitch animations**: On text hover states
- **Neon glow**: All interactive elements
- **Particle effects**: Following mouse movement
- **Matrix-style background**: Rain effect or particle animation
- **Button animations**: Press effects with 0.3s ease transitions
- **Pulsing effects**: On important elements
- **Custom scrollbars**: Neon styling
- **Modal popups**: Blur background effects

## Responsive Design
- **Mobile**: Stack panels vertically
- **Maintain**: Chart and image aspect ratios
- **Hide**: Decorative elements on small screens
- **Preserve**: Core functionality accessibility

## Performance Requirements
- Use CSS transforms (not position changes)
- Optimize animations for 60fps
- CSS Grid and Flexbox for layout
- Lazy loading for images
- Loading states with skeleton screens
- Error states with glitch effects

## Accessibility
Dark mode only interface with consistent neon styling throughout all components and interactions.