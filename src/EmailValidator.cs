using System.Text.RegularExpressions;

namespace CursoClaudePrueba;

public static class EmailValidator
{
    // BUG: la regex es demasiado laxa y acepta dominios como ".com"
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+$", RegexOptions.Compiled);

    public static bool IsValid(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        return EmailRegex.IsMatch(email);
    }
}
