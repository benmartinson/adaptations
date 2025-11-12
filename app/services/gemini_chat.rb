require 'gemini'

class GeminiChat
  def generate_response(prompt)
    client = Gemini::Client.new(ENV['GEMINI_API_KEY'])

    response = client.generate_content(
      prompt,
      model: "gemini-2.5-flash-lite"
    )

    if response.valid?
      response.text 
    else
      "Error: #{response.error}"
    end
  end
end
"Based on the provided list and general popularity of Patrick Rothfuss's works, here are the top 4-5 books that would look best on a list of his works:\n\n1.  
**The Name of the Wind** (work_id: \"OL8479867W\", cover_id: 11480483)\n2.  
**The Wise Man's Fear** (work_id: \"OL8479869W\", cover_id: 8294024)\n3.  
**A Slow Regard of Silent Things** (work_id: \"OL17067388W\", cover_id: 7309640)\n\n**
Additional Considerations for a 4th or 5th spot (depending on what you want to emphasize):**\n\n*   **The Kingkiller Chronicle Series 3 Books Collection Set by Patrick Rothfuss** (work_id: \"OL26428978W\", cover_id: 12394526) or **Kingkiller Chronicle Patrick Rothfuss Collection 3 Books Set** (work_id: \"OL24343635W\", cover_id: 10866334) - These represent the core series and are good for showcasing his main body of work.\n*   **El nom del vent** (work_id: \"OL35023467W\", cover_id: 13987315) or **El nom del vent** (work_id: \"OL35023466W\", cover_id: 13987314) or **O nome do vento – Edicao luxo - A Cronica do Matador do Rei – Livro 1** (work_id: \"OL34315766W\", cover_id: 13234856) or **NOMBRE DEL VIENTO, EL** (work_id: \"OL26388022W\", cover_id: 12335164) - These are different editions/translations of \"The Name of the Wind\". If you want to highlight international appeal or special editions, you could include one of these.\n*   **Temor De Un Hombre Sabio, El** (work_id: \"OL34953533W\", cover_id: 13796224) or **Die Furcht des Weisen I** (work_id: \"OL27291053W\", cover_id: 12619693) - These are translations of \"The Wise Man's Fear\". Similar to the above, they can represent international reach.\n\n**Why these are the best choices:**\n\n*   **The Name of the Wind** and **The Wise Man's Fear** are the two main novels in his highly acclaimed \"Kingkiller Chronicle\" series. They are by far his most popular and recognized works.\n*   **A Slow Regard of Silent Things** is a novella set in the same world, offering a different perspective and is also well-regarded by fans.\n*   The collection sets are excellent for visually representing the core series if you want to show the scope of his major work.\n\nThe other books listed are either anthologies he contributed to, children's books, or foreign language editions of his main works. While they are by him, they don't represent the same level of popularity or the core of his literary output as the \"Kingkiller Chronicle\" books."