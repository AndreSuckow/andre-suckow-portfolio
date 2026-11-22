// Shared canvas geometry for the two actions in the project's TV screen.
export function projectDemoButtons(project, y, desktop) {
  if (!project.demoUrl) return [];
  const split = Boolean(project.mobileVideo && desktop);
  const online = { id: `projetos/demo/${project.slug}`, label: 'Ver projeto online', lines: split ? ['VER PROJETO', 'ONLINE'] : ['VER PROJETO ONLINE'], rect: { x: 584, y, w: split ? 192 : 392, h: 48 } };
  return split ? [online, { id: `projetos/mobile/${project.slug}`, label: 'Ver no celular', lines: ['VER NO', 'CELULAR'], rect: { x: 784, y, w: 192, h: 48 } }] : [online];
}
export function drawProjectDemoActions(ctx, tv, project, y, drawButton, drawText, colors) {
  for (const button of projectDemoButtons(project, y, matchMedia('(hover: hover) and (pointer: fine)').matches)) {
    drawButton(ctx, tv, { ...button, label: '', announce: button.label });
    const selected = tv.isSelected(button.id) || tv.hoverId === button.id;
    button.lines.forEach((line, index) => drawText(ctx, line, button.rect.x + button.rect.w / 2,
      y + (button.lines.length === 1 ? 13 : 3 + index * 21),
      { size: 20, bold: true, color: selected ? colors.bg : colors.text, align: 'center', shadow: !selected, max: button.rect.w - 16 }));
  }
}
