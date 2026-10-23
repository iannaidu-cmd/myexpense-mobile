-- Add two emails to the 3-month tester promo list granted on sign-up
-- (on_tester_signup -> handle_tester_promo_access). Body copied from the live
-- function on 2026-10-23; only the two emails at the end of the list are new.
-- lvan.ayliffe is probably a typo of ivan.ayliffe (already listed); harmless
-- to include either way.
--
-- Note: the live function grants 3 months, superseding the 14-day version in
-- 20260720000001_track_new_user_and_tester_promo_triggers.sql.

CREATE OR REPLACE FUNCTION public.handle_tester_promo_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF lower(NEW.email) IN (
    'tim@smithand.co.za',
    'mduvenage@gmail.com',
    'zozomumbo@gmail.com',
    'skholiweg@gmail.com',
    'shanfree@gmail.com',
    'shaheensydow@gmail.com',
    'savvysouthernsolution@gmail.com',
    'phehellomokoena@hotmail.com',
    'nselenomonde950@gmail.com',
    'nobuhle.makhathini@outlook.com',
    'nicole@orangefilms.co.za',
    'marc@andewing.com',
    'malekabaatile@gmail.com',
    'luxolo.ndlazi@icloud.com',
    'ian.naidu@gmail.com',
    'florriemunhumumwe@gmail.com',
    'dikotla.alekgatle@gmail.com',
    'bluehandlilly@yahoo.com',
    'amolelemane@gmail.com',
    'mphokau@gmail.com',
    'serudut4u@gmail.com',
    'bellasprideforthe11@gmail.com',
    'tabethanotidaishe@gmail.com',
    'nkuleh11@gmail.com',
    'mavischauke8@gmail.com',
    'ntsolutions.finance@gmail.com',
    'abednic9@gmail.com',
    'lorenzogrigg@gmail.com',
    'emilydavies1256@gmail.com',
    'zamantombenhle6@gmail.com',
    'refilweplantina8@gmail.com',
    'michaelmonama@gmail.com',
    'nthulerefoundation@gmail.com',
    'dipolelomakama@gmail.com',
    'gettyjama@gmail.com',
    'jackieseroba@gmail.com',
    'mphatelehlahe@gmail.com',
    'jacobsgail54@gmail.com',
    'putapamla@gmail.com',
    'chrispelo78@gmail.com',
    'amielkgatle@gmail.com',
    'booysenscasey@gmail.com',
    'mokwane7@gmail.com',
    'annahmotso89@gmail.com',
    'erephimah@gmail.com',
    'zaharajaine@gmail.com',
    'maleribemotsoane8@gmail.com',
    'mpendulomdhluli064@gmail.com',
    'maryzisengwe@gmail.com',
    'mmanasothandiwe@gmail.com',
    'linnetndhlovu1988@gmail.com',
    'sedialerato@gmail.com',
    'dominiquekaycee@gmail.com',
    'asive390@gmail.com',
    'giftzweni@gmail.com',
    'ne.tsembeni@gmail.com',
    'eragon.dupreez@gmail.com',
    'mavasibulawa@gmail.com',
    'bonisiwemncube21@outlook.com',
    'thisisdavidharris@gmail.com',
    'hardymac2@me.com',
    'marc.fletcher@hedleysydney.co.za',
    'roshanramprsad@outlook.com',
    'aderinsolaadebulehin@gmail.com',
    't.katephilip@gmail.com',
    'simross54@gmail.com',
    'sarah@tique.co.za',
    'jaredpaisley@gmail.com',
    'bryn.cannon@gmail.com',
    'tonytwodogs@gmail.com',
    'sasha@sashaella.com',
    'mila.wilson@gmail.com',
    'ivan.ayliffe@gmail.com',
    'tricia@the-joneses.tv',
    'robijnster@gmail.com',
    'clairejallison@gmail.com',
    'nathan@culturetalent.co.za',
    'mutoni@southeastprop.co.za',
    'debbie.lott@gmail.com',
    'laurasampson@hotmail.com',
    'traceylr@maxcey.co.za',
    'kyle@erafold.com',
    'richard@phonographic.co.za',
    'agentmcguinness@gmail.com',
    'joclegg@thefoodcrew.co.za',
    'greg@machinecode.co.za',
    'liezljvv@gmail.com',
    'lvan.ayliffe@gmail.com'
  ) THEN
    UPDATE public.profiles
    SET promo_expires_at = now() + interval '3 months'
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;
