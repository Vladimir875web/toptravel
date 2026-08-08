-- Run in Supabase SQL Editor if leads still has client_name only

alter table leads add column if not exists customer_name text;

update leads
set customer_name = client_name
where customer_name is null
  and client_name is not null;
