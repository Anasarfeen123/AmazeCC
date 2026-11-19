# AmazeCC navigation

Navigation is a tool, not artwork: fast, obvious, the same on every screen.

| Width               | Navigation                                                 | Notes                                                                                                                                                                                   |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phone (< 768px)     | Floating bottom bar: Home · Academics · Calendar · Modules | Teal panel, icon + mono label, ochre active tab. Modules opens the `BrandSheet` with every module (one column, pin up to 4 to the bar).                                                 |
| Tablet (768–1023px) | 72px icon rail by default                                  | Expanding is temporary (overlays, not saved) so content keeps its width.                                                                                                                |
| Desktop (≥ 1024px)  | 280px docked sidebar                                       | Teal panel: logo + Sync + collapse, semester card (Attend / Credits / OD / CGPA), search, Pinned, Study, Campus, Tools, account footer with theme switch. Collapse preference is saved. |

Every page uses `PageShell`: the ochre back button sits top-left and names
where it goes; page actions sit top-right as 44px icon buttons. The global
search ("Spotlight", `/` or Ctrl/⌘ K) reaches every page and action.

Content padding: 16px phone gutter, offset by 72px / 280px on tablet /
desktop (`components/custom/Dashboard.tsx`).
