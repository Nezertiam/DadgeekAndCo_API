"use strict";
import nodemailer from "nodemailer";
import config from "config";

// async..await is not allowed in global scope, must use a wrapper
export const sendRegisterValidation = async (email, uniqueString) => {
    var Transport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: config.get("gmailUser"),
            pass: config.get("gmailPassword")
        }
    });

    const link = `http://localhost:5000/api/security/verify/${uniqueString}`;

    const mailOptions = {
        from: `"Le Blog des Geemers" <${config.get("gmailUser")}>`,
        to: email,
        subject: "Confirmation de votre addresse mail",
        html:
            `<table cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #c2c2c299; border-radius: 10px; max-width: 700px; margin: 0 auto; padding: 3rem 2.5rem 5rem;">
                <thead>
                    <tr>
                        <th>
                            <h2 style="padding-bottom: 2rem;">Le Blog des Geemers</h2>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <h2>Finalisation de votre compte Geemer</h2>
                        </td>
                    </tr>
                    <tr>
                        <p>Bienvenue dans la communauté DadGeek and Co, Geemer !</p>
                        <p>
                            Afin de finaliser votre inscription, vous devez d'abord valider votre adresse email en cliquant sur le lien qui suit.
                            Si le lien ne fonctionne pas, vous pouvez toujours le copier coller.<br />
                            <br />
                            ${link}
                        </p>
                    </tr>
                </tbody>
            </table>`
    }

    Transport.sendMail(mailOptions, (error, response) => {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent");
        }
    })
}

// send().catch(console.error);