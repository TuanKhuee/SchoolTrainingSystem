using backend.Models;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace backend.Tests.TestHelpers;

public static class MockUserManager
{
    public static Mock<UserManager<User>> Create()
    {
        var store = new Mock<IUserStore<User>>();
        var mockUserManager = new Mock<UserManager<User>>(
            store.Object,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null);

        return mockUserManager;
    }

    public static Mock<UserManager<User>> CreateWithUser(User user, string password)
    {
        var mockUserManager = Create();

        mockUserManager.Setup(x => x.FindByEmailAsync(user.Email!))
            .ReturnsAsync(user);

        mockUserManager.Setup(x => x.CheckPasswordAsync(user, password))
            .ReturnsAsync(true);

        mockUserManager.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { user.Role });

        return mockUserManager;
    }

    public static Mock<UserManager<User>> CreateWithInvalidPassword(User user)
    {
        var mockUserManager = Create();

        mockUserManager.Setup(x => x.FindByEmailAsync(user.Email!))
            .ReturnsAsync(user);

        mockUserManager.Setup(x => x.CheckPasswordAsync(user, It.IsAny<string>()))
            .ReturnsAsync(false);

        return mockUserManager;
    }

    public static Mock<UserManager<User>> CreateWithNonExistentUser()
    {
        var mockUserManager = Create();

        mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync((User?)null);

        return mockUserManager;
    }
}
