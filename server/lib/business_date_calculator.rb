require 'holiday_jp'

class BusinessDateCalculator
  def self.business_days_ago(from_date, days)
    date = from_date
    count = 0

    while count < days
      date -= 1
      unless date.saturday? || date.sunday? || HolidayJp.holiday?(date)
        count += 1
      end
    end

    date
  end
end
