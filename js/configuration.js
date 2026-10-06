/* ============================================================================
 *  INTRANET HSE — CDES  ·  Portail des outils + tableau de bord KPI
 * ----------------------------------------------------------------------------
 *  CONFIGURATION : plus rien à modifier ici. L'adresse /exec du script
 *  « Intranet HSE » se met dans config.js, à côté de ce fichier :
 *      window.CONFIG_HSE = { WEBHOOK_URL: 'https://…/exec' };
 *  Avec cette adresse, TOUT LE MONDE voit les indicateurs (lecture seule).
 *  La modification, elle, passe par le lien de branchement (avec mot de passe).
 *
 *  DÉPANNAGE : si tu ne peux pas déposer config.js, colle l'adresse dans
 *  WEBHOOK_SECOURS ci-dessous — mais il faudra la recoller à chaque version.
 * ========================================================================== */
const WEBHOOK_SECOURS = '';
const BANQUE_SECOURS = '';
const CONFIG = {
  WEBHOOK_URL: (window.CONFIG_HSE && window.CONFIG_HSE.WEBHOOK_URL) || WEBHOOK_SECOURS || '',
  /* Service « Banque documentaire » (flashs + modes opératoires). Facultatif :
     sans lui, l'intranet fonctionne exactement comme avant, la banque affiche
     seulement les liens ajoutés à la main. */
  BANQUE_URL: (window.CONFIG_HSE && window.CONFIG_HSE.BANQUE_URL) || BANQUE_SECOURS || ''
};
