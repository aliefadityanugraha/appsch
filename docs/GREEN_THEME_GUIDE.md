# TUKIN SMATAJAYA - Modern Blue-Purple Theme Guide

## Overview
Tema aplikasi telah diubah dari hijau ke biru-ungu yang lebih modern dan profesional.

## Color Palette

### Primary Colors (Blue-Purple Gradient)
```css
--primary: #667eea;        /* Main blue */
--primary-dark: #5a67d8;   /* Darker blue */
--primary-darker: #4c51bf; /* Darkest blue */
--primary-light: #7c8ff0;  /* Light blue */
--secondary: #764ba2;      /* Purple accent */
--secondary-dark: #6b46c1; /* Dark purple */
```

### Accent Colors
```css
--accent-teal: #38b2ac;    /* Teal for variety */
--accent-amber: #f6ad55;   /* Amber/orange */
--accent-rose: #ed64a6;    /* Pink/rose */
```

### Status Colors (Unchanged)
```css
--success: #10b981;  /* Green - for success states */
--warning: #f59e0b;  /* Amber - for warnings */
--danger: #ef4444;   /* Red - for errors */
--info: #3b82f6;     /* Blue - for info */
```

## Files Updated

1. `public/css/custom-theme.css` - Main theme variables and overrides
2. `public/css/dashboard.css` - Dashboard specific styles
3. `public/css/rbac-control.css` - RBAC control panel styles
4. `views/components/navbar.ejs` - Sidebar and top navbar
5. `views/login.ejs` - Already using blue-purple (unchanged)
6. `views/register.ejs` - Already using blue-purple (unchanged)

## Usage

### Gradient Backgrounds
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Buttons
```css
.btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
}
```

### Hover Effects
```css
box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
```

## Notes
- Login dan Register sudah menggunakan tema biru-ungu dari awal
- Success states tetap menggunakan hijau (#10b981) karena itu standar UX
- Sidebar menggunakan dark indigo (#1e1b4b) untuk kontras yang baik
