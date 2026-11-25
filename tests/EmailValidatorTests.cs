using CursoClaudePrueba;
using Xunit;

namespace CursoClaudePrueba.Tests;

public class EmailValidatorTests
{
    [Theory]
    [InlineData("usuario@dominio.com")]
    [InlineData("nombre.apellido@sub.dominio.es")]
    [InlineData("usuario+etiqueta@dominio.org")]
    [InlineData("user_name@mi-dominio.io")]
    public void IsValid_ReturnsTrue_ForValidEmails(string email)
    {
        Assert.True(EmailValidator.IsValid(email));
    }

    [Theory]
    [InlineData("usuario@.com")]
    [InlineData("usuario@com")]
    [InlineData("usuario@dominio..com")]
    [InlineData("usuario@-dominio.com")]
    [InlineData("@dominio.com")]
    [InlineData("usuario@dominio.")]
    [InlineData("usuario@@dominio.com")]
    [InlineData("usuario dominio@mail.com")]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void IsValid_ReturnsFalse_ForInvalidEmails(string? email)
    {
        Assert.False(EmailValidator.IsValid(email));
    }
}
