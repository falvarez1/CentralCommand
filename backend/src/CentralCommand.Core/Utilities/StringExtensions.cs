using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace CentralCommand.Core.Utilities;

/// <summary>
/// String extension methods
/// </summary>
public static class StringExtensions
{
    /// <summary>
    /// Converts a string to kebab-case
    /// </summary>
    public static string ToKebabCase(this string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        var pattern = "(?<!^)([A-Z][a-z]|(?<=[a-z])[A-Z])";
        return Regex.Replace(text, pattern, "-$1", RegexOptions.Compiled)
            .Trim()
            .ToLower();
    }

    /// <summary>
    /// Converts a string to camelCase
    /// </summary>
    public static string ToCamelCase(this string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        var words = text.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
        if (words.Length == 0)
            return text;

        var result = new StringBuilder(words[0].ToLower());
        for (int i = 1; i < words.Length; i++)
        {
            result.Append(CultureInfo.CurrentCulture.TextInfo.ToTitleCase(words[i].ToLower()));
        }

        return result.ToString();
    }

    /// <summary>
    /// Converts a string to PascalCase
    /// </summary>
    public static string ToPascalCase(this string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        var words = text.Split(new[] { ' ', '-', '_' }, StringSplitOptions.RemoveEmptyEntries);
        return string.Join("", words.Select(w => CultureInfo.CurrentCulture.TextInfo.ToTitleCase(w.ToLower())));
    }

    /// <summary>
    /// Truncates a string to a specified length
    /// </summary>
    public static string Truncate(this string text, int maxLength, string suffix = "...")
    {
        if (string.IsNullOrEmpty(text) || text.Length <= maxLength)
            return text;

        return text.Substring(0, maxLength - suffix.Length) + suffix;
    }

    /// <summary>
    /// Removes HTML tags from a string
    /// </summary>
    public static string StripHtml(this string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        return Regex.Replace(text, "<.*?>", string.Empty);
    }

    /// <summary>
    /// Converts a string to a slug (URL-friendly format)
    /// </summary>
    public static string ToSlug(this string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        // Remove accents
        var normalizedString = text.Normalize(NormalizationForm.FormD);
        var stringBuilder = new StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        var slug = stringBuilder.ToString().Normalize(NormalizationForm.FormC);

        // Replace spaces with hyphens
        slug = Regex.Replace(slug, @"\s+", "-", RegexOptions.Compiled);

        // Remove invalid characters
        slug = Regex.Replace(slug, @"[^a-zA-Z0-9\-]", "", RegexOptions.Compiled);

        // Remove multiple hyphens
        slug = Regex.Replace(slug, @"\-{2,}", "-", RegexOptions.Compiled);

        // Trim hyphens from start and end
        return slug.Trim('-').ToLower();
    }

    /// <summary>
    /// Checks if a string is a valid email address
    /// </summary>
    public static bool IsValidEmail(this string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Checks if a string is a valid URL
    /// </summary>
    public static bool IsValidUrl(this string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }

    /// <summary>
    /// Masks sensitive information in a string
    /// </summary>
    public static string Mask(this string text, int visibleStart = 3, int visibleEnd = 3, char maskChar = '*')
    {
        if (string.IsNullOrEmpty(text))
            return text;

        if (text.Length <= visibleStart + visibleEnd)
            return new string(maskChar, text.Length);

        var masked = text.Substring(0, visibleStart);
        masked += new string(maskChar, text.Length - visibleStart - visibleEnd);
        masked += text.Substring(text.Length - visibleEnd);

        return masked;
    }
}