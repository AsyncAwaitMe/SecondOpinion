Usage:

1. The `ThemeProvider` is already used in `src/App.jsx` so the theme is
   available app-wide.
2. Use `useTheme()` hook to read/update theme.

Example:

import { useTheme } from '../context/ThemeContext';

const MyComponent = () => { const { theme, toggleTheme, isDark } = useTheme();
return <button onClick={toggleTheme}>{isDark ? '🌙' : '🌞'}</button>; };

Testing:

- Run `npm run dev` in `client/` and open the app.
- Toggling the button will add/remove the `dark` class on the `<html>` element
  so Tailwind's `dark:` classes apply.
