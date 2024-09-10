import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeWebpage(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $("script, style").remove();

    // Extract text content
    const text = $("body").text().trim().replace(/\s+/g, " ");
    
    return text;
  } catch (error) {
    console.error("Error scraping webpage:", error);
    throw error;
  }
}
