
export function SidebarFooter() {
  return (
    <div className="border-t p-4">
      <div className="text-xs text-muted-foreground">
        <p className="font-display">© {new Date().getFullYear()} Admin</p>
      </div>
    </div>
  );
}
