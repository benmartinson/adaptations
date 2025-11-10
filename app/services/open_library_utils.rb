module OpenLibraryUtils
  # Normalizes a date string to 'yyyy-mm-dd' format
  # Handles formats like:
  # - "2024" -> "2024-01-01"
  # - "2024 april" -> "2024-04-01"
  # - "april 2024" -> "2024-04-01"
  # - "2024-04" -> "2024-04-01"
  def normalize_date(date)
    return nil unless date.present?
    
    date_str = date.to_s.strip
    
    # Check if it's already in yyyy-mm-dd format
    if date_str.match?(/^\d{4}-\d{2}-\d{2}$/)
      return date_str
    end
    
    # Extract 4-digit year
    year_match = date_str.match(/\b(\d{4})\b/)
    return date_str unless year_match # If no year found, return as-is
    
    year = year_match[1]
    
    # Check if there's a full date format like "2024-04-15" or "2024-4-15"
    full_date_match = date_str.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)
    if full_date_match && full_date_match[2].to_i.between?(1, 12) && full_date_match[3].to_i.between?(1, 31)
      month = full_date_match[2].rjust(2, "0")
      day = full_date_match[3].rjust(2, "0")
      return "#{year}-#{month}-#{day}"
    end
    
    # Month name mapping (case-insensitive)
    month_map = {
      "january" => "01", "jan" => "01",
      "february" => "02", "feb" => "02",
      "march" => "03", "mar" => "03",
      "april" => "04", "apr" => "04",
      "may" => "05",
      "june" => "06", "jun" => "06",
      "july" => "07", "jul" => "07",
      "august" => "08", "aug" => "08",
      "september" => "09", "sep" => "09", "sept" => "09",
      "october" => "10", "oct" => "10",
      "november" => "11", "nov" => "11",
      "december" => "12", "dec" => "12"
    }
    
    # Try to find month name in the date string
    month = "01" # Default to January
    month_map.each do |month_name, month_num|
      if date_str.match?(/\b#{month_name}\b/i)
        month = month_num
        break
      end
    end
    
    # Check if there's already a month in numeric format (e.g., "2024-04")
    numeric_month_match = date_str.match(/\b(\d{4})-(\d{1,2})\b/)
    if numeric_month_match && numeric_month_match[2].to_i.between?(1, 12)
      month = numeric_month_match[2].rjust(2, "0")
    end
    
    # Extract day if present (1-31)
    # Look for day numbers that are separate from the year
    day = "01" # Default to first of month
    
    # Try to find a day number after removing the year and month
    date_without_year = date_str.gsub(year, "").strip
    # Also remove month names
    month_map.keys.each { |month_name| date_without_year.gsub!(/\b#{month_name}\b/i, "") }
    date_without_year = date_without_year.strip
    
    day_match = date_without_year.match(/\b(\d{1,2})\b/)
    if day_match
      potential_day = day_match[1].to_i
      if potential_day.between?(1, 31)
        day = potential_day.to_s.rjust(2, "0")
      end
    end
    
    "#{year}-#{month}-#{day}"
  end

  def language_from_key(key)
    if key.blank?
      return nil
    end
    lang_key = key.split("/").last
    language_map = {
      "eng" => "English",
      "spa" => "Spanish",
      "fre" => "French",
      "deu" => "German",
      "ita" => "Italian",
      "por" => "Portuguese",
      "jpn" => "Japanese",
      "kor" => "Korean",
      "chi" => "Chinese"
    }
    language = language_map[lang_key] if language_map[lang_key].present?
    language = lang_key.upcase if language.blank?
    language
  end

  def get_format(edition_data)
    physical_format = edition_data["physical_format"].present? ? edition_data["physical_format"].capitalize : nil
    number_of_pages = edition_data["number_of_pages"]

    format = number_of_pages.present? ? "#{number_of_pages} pages" : nil
    format = "#{format}, " if format.present? && physical_format.present?
    format = "#{format}#{physical_format}" if physical_format.present?
    format
  end
end

