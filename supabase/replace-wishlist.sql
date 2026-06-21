-- Replace the entire gift wishlist with a new set.
-- Run in Supabase dashboard → SQL Editor → New query → Run.

delete from public.wishlist;

insert into public.wishlist (id, position, emoji, en_name, nl_name, fa_name, reserved)
values
  ('beach-toys',     1, '🏖️', 'Beach toy set',          'Strandspeelset',                 'Beach toy set',               false),
  ('towel-poncho',   2, '🦖', 'Towel poncho (2-3 years)','Badponcho / handdoek (2-3 jaar)','Towel poncho (2-3 years)',     false),
  ('magnet-tiles',   3, '🧲', 'Magnet tiles',           'Magnetische tegels',             'Magnet tiles',                false),
  ('igor-sandals',   4, '🩴', 'Igor sandals (size 21)', 'Igor sandalen (maat 21)',        'Igor sandals (size 21)',      false),
  ('play-tent',      5, '⛺', 'Play tent',              'Speeltent',                      'Play tent',                   false),
  ('train',          6, '🚂', 'Train',                  'Trein',                          'Train',                       false),
  ('flamingo-ring',  7, '🦩', 'Flamingo swimming ring for kids','Flamingo zwemband (kinderen)','Flamingo swimming ring for kids',false),
  ('finger-paint',   8, '🎨', 'Finger paint',           'Vingerverf',                     'Finger paint',                false);
