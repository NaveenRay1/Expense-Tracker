
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPasswordResetEmail = async (email, resetLink) => {
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: [email],
        subject: "Reset your ExpenseTracker password",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #333;
            ">

                <h2 style="color: #4f46e5;">
                    ExpenseTracker Password Reset
                </h2>

                <p>
                    You requested a password reset for your
                    ExpenseTracker account.
                </p>

                <p>
                    Click the button below to create a new password.
                </p>

                <div style="margin: 30px 0;">
                    <a
                        href="${resetLink}"
                        style="
                            display: inline-block;
                            padding: 12px 22px;
                            background: #4f46e5;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                        "
                    >
                        Reset Password
                    </a>
                </div>

                <p>
                    This password reset link will expire in
                    <strong>15 minutes</strong>.
                </p>

                <p style="color: #666;">
                    If you did not request a password reset,
                    you can safely ignore this email.
                </p>

                <p style="color: #999; font-size: 13px;">
                    If the button does not work, copy and paste
                    this link into your browser:
                </p>

                <p style="
                    word-break: break-all;
                    color: #4f46e5;
                    font-size: 13px;
                ">
                    ${resetLink}
                </p>

            </div>
        `
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

module.exports = {
    sendPasswordResetEmail
};

