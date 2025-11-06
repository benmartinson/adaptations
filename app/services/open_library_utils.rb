module OpenLibraryUtils
  # Normalizes a date string to a full date format
  # If the date is just a year (4 digits), converts it to "YYYY-01-01"
  # Otherwise returns the date as-is
  def normalize_date(date)
    return nil unless date.present?
    
    if date.is_a?(String) && date.length == 4 && date.match?(/^\d{4}$/)
      "#{date}-01-01"
    else
      date
    end
  end

  def language_from_key(key)
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
end

