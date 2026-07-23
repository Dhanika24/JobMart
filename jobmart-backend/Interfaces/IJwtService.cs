using jobmart.Models;

namespace jobmart.Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}