export function whatsappMessage(date) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: 'America/Sao_Paulo',
    }).format(date),
  );
  const greeting =
    hour >= 5 && hour < 12 ? 'bom dia' : hour >= 12 && hour < 18 ? 'boa tarde' : 'boa noite';
  return `Olá, ${greeting}! Temos uma oportunidade para você!`;
}
