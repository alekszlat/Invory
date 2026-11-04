using Invory.Models.Interfaces;
using MailKit.Net.Smtp;
using MimeKit;
namespace Invory.Models.HelperClasses
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmail(string email, string subject, string message)
        {
            var emailMessage = new MimeMessage();

            // От кого
            emailMessage.From.Add(new MailboxAddress("Invory Support", _configuration["EmailSettings:SenderEmail"]));
            // До кого
            emailMessage.To.Add(new MailboxAddress("", email));

            //какво пише
            emailMessage.Subject = subject;
            emailMessage.Body = new TextPart("plain") { Text = message };



            using (var client = new SmtpClient())
            {
                // Свързваме се към SMTP сървъра (напр. порт 587 с STARTTLS)
                client.CheckCertificateRevocation = false;
                try
                {
                    await client.ConnectAsync(
                            _configuration["EmailSettings:SmtpServer"],
                            int.Parse(_configuration["EmailSettings:Port"]),
                            MailKit.Security.SecureSocketOptions.StartTls
                        );


                    // Автентикира ми данните за акаунта
                    await client.AuthenticateAsync(
                        _configuration["EmailSettings:SenderEmail"],
                        _configuration["EmailSettings:SenderPassword"]
                    );


                    // Изпращане
                    await client.SendAsync(emailMessage);

                }
                catch (Exception ex)
                {
                    throw ex;
                }
              
                await client.DisconnectAsync(true);
            }
        }
    }
}
