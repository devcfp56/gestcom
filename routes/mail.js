const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Route pour envoyer un e-mail BL
router.post('/send-mail-bl', (req, res) => {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com', // Serveur SMTP Outlook
      port: 587,
      secure: false, // Utilise STARTTLS
      auth: {
        user: 'stage@cfp56.com', // Adresse e-mail de l'expéditeur
        pass: 'BBg889zrt', // Mot de passe de l'e-mail
      },
    });

    let text = `
        Bonjour,<br><br>

        Veuillez trouver ci-joint votre <b>BON DE LIVRAISON</b> suivant la référence en objet.<br><br>

        La marchandise a été confiée ce jour au <b>TRANSPORT</b>.<br>
        Ils prendront contact avec vous dans les prochains jours afin de fixer un rendez-vous pour une livraison sous 7 à 10 jours ouvrés.<br>
        Si vous avez des informations de livraison à préciser, vous pouvez les contacter au <b>TEL</b>.<br><br>

        Nous restons à votre disposition pour tous renseignements complémentaires.<br><br>

        Vous souhaitant bonne réception.<br><br>

        Le service Expédition<br>
        --- CFP ---<br>
        02 97 46 98 98<br>
        cfp@cfp56.com<br><br>

        Rendez-vous sur notre site internet : www.cfp56.com
        `;

    // Remplacer TRANSPORT, TEL par les valeurs fournies
    text = text.replace('TRANSPORT', req.body.transport);
    text = text.replace('TEL', req.body.tel);

    console.log(req.body.BL);
  
    const mailOptions = {
      from: 'stage@cfp56.com', // Expéditeur
      to: 'stage@cfp56.com', // Destinataire
      subject: 'CFP - BON de LIVRAISON N°: '+ req.body.numeroBL + ' de la commande '+ req.body.numeroCommande + ' : '+ req.body.ref, // Objet du message
      html: text, // Corps du message
      attachments: [
        {
          filename: 'BL_'+req.body.numeroBL+'.pdf',
          path: req.body.BL
        },
      ],
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        res.status(500).send('Erreur lors de l\'envoi de l\'e-mail');
      } else {
        console.log('E-mail envoyé :', info.response);
        res.status(200).send('E-mail envoyé avec succès');
      }
    });
  });

// Route pour envoyer un e-mail de paiement avec fabrication
router.post('/send-mail-paiement', (req, res) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com', // Serveur SMTP Outlook
    port: 587,
    secure: false, // Utilise STARTTLS
    auth: {
      user: 'stage@cfp56.com', // Adresse e-mail de l'expéditeur
      pass: 'BBg889zrt', // Mot de passe de l'e-mail
    },
  });

  let text = `
    Bonjour,<br><br>

    Votre commande N° <b>NUMCOMMANDE</b> est prévue en production dans nos ateliers le DF.<br>
    Suivant les conditions de paiement définies pour celle-ci, le solde doit être versé avant sa mise en fabrication.<br><br>
    
    Merci de bien vouloir effectuer ce règlement afin de conserver la date d’expédition prévue le DLIVRAISON.<br><br>

    Vous souhaitant bonne réception.<br><br>

    Le service Comptabilité.<br>
    --- CFP ---<br>
    02 97 46 98 98<br>
    cfp@cfp56.com<br><br>

    Rendez-vous sur notre site internet : www.cfp56.com
    `;

  // Remplacer NUMCOMMANDE, DF et DLIVRAISON par les valeurs fournies
  text = text.replace('NUMCOMMANDE', req.body.numeroCommande);
  text = text.replace('DF', req.body.dateFabrication);
    text = text.replace('DLIVRAISON', req.body.dateLivraison);

  const mailOptions = {
    from: 'stage@cfp56.com', // Expéditeur
    to: 'stage@cfp56.com', // Destinataire
    subject: 'CFP - Rappel de Paiement avant Fabrication de la commande '+ req.body.numeroCommande + ' : '+ req.body.ref, // Objet du message
    html: text // Corps du message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
      res.status(500).send('Erreur lors de l\'envoi de l\'e-mail');
    } else {
      console.log('E-mail envoyé :', info.response);
      res.status(200).send('E-mail envoyé avec succès');
    }
  });

});

// Route pour envoyer un e-mail de relance de paiement
router.post('/send-mail-relance', (req, res) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com', // Serveur SMTP Outlook
    port: 587,
    secure: false, // Utilise STARTTLS
    auth: {
      user: 'stage@cfp56.com', // Adresse e-mail de l'expéditeur
      pass: 'BBg889zrt', // Mot de passe de l'e-mail
    },
  });

  let text = `
    Bonjour,<br><br>

    Votre commande N° <b>NUMCOMMANDE</b> est en production dans nos ateliers.<br>
    Suivant les conditions de paiement définies pour celle-ci, le solde doit être versé avant son départ de l’usine qui est prévu le DLIVRAISON.<br><br> 
    
    Merci de bien vouloir effectuer ce règlement afin de conserver la date d’expédition prévue.<br><br>

    Vous souhaitant bonne réception.<br><br>

    Le service Comptabilité.<br>
    --- CFP ---<br>
    02 97 46 98 98<br>
    cfp@cfp56.com<br><br>

    Rendez-vous sur notre site internet : www.cfp56.com
    `;

  // Remplacer NUMCOMMANDE, DLIVRAISON par les valeurs fournies
  text = text.replace('NUMCOMMANDE', req.body.numeroCommande);
  text = text.replace('DLIVRAISON', req.body.dateLivraison);

  const mailOptions = {
    from: 'stage@cfp56.com', // Expéditeur
    to: 'stage@cfp56.com', // Destinataire
    subject: 'CFP - Rappel de Paiement avant Fabrication de la commande '+ req.body.numeroCommande + ' : '+ req.body.ref, // Objet du message
    html: text // Corps du message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
      res.status(500).send('Erreur lors de l\'envoi de l\'e-mail');
    } else {
      console.log('E-mail envoyé :', info.response);
      res.status(200).send('E-mail envoyé avec succès');
    }
  });

});


module.exports = router;