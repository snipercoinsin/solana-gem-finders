import { useState, useEffect } from 'react';
import { Palette, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const themes = [
  { name: 'Neon Green', value: 'green', primary: '142 76% 45%', accent: '142 76% 45%' },
  { name: 'Cyber Cyan', value: 'cyan', primary: '186 100% 50%', accent: '186 100% 50%' },
  { name: 'Neon Purple', value: 'purple', primary: '270 76% 55%', accent: '270 76% 55%' },
  { name: 'Electric Blue', value: 'blue', primary: '210 100% 56%', accent: '210 100% 56%' },
  { name: 'Hot Pink', value: 'pink', primary: '330 100% 60%', accent: '330 100% 60%' },
  { name: 'Amber Gold', value: 'amber', primary: '45 100% 50%', accent: '45 100% 50%' },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('green');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('scanner-theme');
    const savedMode = localStorage.getItem('scanner-dark-mode');
    
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
    
    // Default to dark mode
    const darkMode = savedMode !== 'false';
    setIsDark(darkMode);
    applyDarkMode(darkMode);
  }, []);

  const applyTheme = (themeValue: string) => {
    const theme = themes.find(t => t.value === themeValue);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--ring', theme.primary);
  };

  const applyDarkMode = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (themeValue: string) => {
    setCurrentTheme(themeValue);
    localStorage.setItem('scanner-theme', themeValue);
    applyTheme(themeValue);
  };

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('scanner-dark-mode', String(newDark));
    applyDarkMode(newDark);
  };

  const currentThemeName = themes.find(t => t.value === currentTheme)?.name || 'Neon Green';

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDarkMode}
        className="border-primary/50 hover:bg-primary/10"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="border-primary/50 hover:bg-primary/10">
            <Palette className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{currentThemeName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-border">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Accent Color</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => handleThemeChange(theme.value)}
              className={`cursor-pointer ${currentTheme === theme.value ? 'bg-primary/20' : ''}`}
            >
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: `hsl(${theme.primary})` }}
              />
              {theme.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}