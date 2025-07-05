
// Helper to extract JSON from potentially messy output
export const extractJsonFromText = (text: string): string => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}