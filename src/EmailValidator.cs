using System.Text.RegularExpressions;

namespace CursoClaudePrueba;

public static class EmailValidator
{
    // Parte local: bloques alfanuméricos separados por un único . _ % + -
    //   (sin separadores al inicio, al final ni consecutivos).
    // Dominio: una o más etiquetas alfanuméricas (guiones solo en medio),
    //   separadas por un único punto, y un TLD de al menos 2 letras.
    private const string Pattern =
        @"^[A-Za-z0-9]+(?:[._%+\-][A-Za-z0-9]+)*" +
        @"@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}\z";

    private static readonly Regex EmailRegex = new(Pattern, RegexOptions.Compiled);

    public static bool IsValid(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        return EmailRegex.IsMatch(email);
    }
}
