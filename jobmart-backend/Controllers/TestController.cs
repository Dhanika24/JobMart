using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet("public")]
        public IActionResult PublicEndpoint()
        {
            return Ok(new
            {
                message = "Anyone can access this endpoint."
            });
        }

        [Authorize]
        [HttpGet("protected")]
        public IActionResult ProtectedEndpoint()
        {
            return Ok(new
            {
                message = "You are authenticated."
            });
        }

        [Authorize(Roles = "Candidate")]
        [HttpGet("candidate")]
        public IActionResult CandidateEndpoint()
        {
            return Ok(new
            {
                message = "Welcome Candidate!"
            });
        }

        [Authorize(Roles = "Recruiter")]
        [HttpGet("recruiter")]
        public IActionResult RecruiterEndpoint()
        {
            return Ok(new
            {
                message = "Welcome Recruiter!"
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("admin")]
        public IActionResult AdminEndpoint()
        {
            return Ok(new
            {
                message = "Welcome Admin!"
            });
        }
    }
}