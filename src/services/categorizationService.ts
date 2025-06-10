interface ProductCategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
  commonName: string;
  success: boolean;
}

class CategorizationService {
  async categorizeProduct(
    productName: string
  ): Promise<ProductCategorizationResult> {
    // Validate input
    if (!productName?.trim()) {
      throw new Error("Product name is required");
    }

    console.log(`🔍 Categorizing product: "${productName}"`);

    return this.fallbackCategorization(productName.trim());
  }

  private fallbackCategorization(
    productName: string
  ): ProductCategorizationResult {
    const lowerName = productName.toLowerCase();

    // Rule-based categorization with Polish and English support
    const rules = [
      {
        keywords: [
          "milk",
          "cheese",
          "yogurt",
          "butter",
          "cream",
          "fantazja",
          "kefir",
          "mleko",
          "ser",
          "jogurt",
          "masło",
          "śmietana",
          "twaróg",
          "jajka",
          "eggs",
        ],
        category: "Dairy & Eggs",
        reasoning: "Contains dairy-related keywords (English/Polish)",
      },
      {
        keywords: [
          "apple",
          "banana",
          "orange",
          "carrot",
          "onion",
          "potato",
          "tomato",
          "lettuce",
          "cucumber",
          "jabłko",
          "banan",
          "pomarańcza",
          "marchew",
          "cebula",
          "ziemniak",
          "pomidor",
          "sałata",
          "ogórek",
        ],
        category: "Fruits & Vegetables",
        reasoning: "Contains fruit or vegetable keywords (English/Polish)",
      },
      {
        keywords: [
          "coca",
          "pepsi",
          "juice",
          "water",
          "coffee",
          "tea",
          "beer",
          "wine",
          "soda",
          "żubrówka",
          "sok",
          "woda",
          "kawa",
          "herbata",
          "piwo",
          "wino",
          "napój",
        ],
        category: "Beverages",
        reasoning: "Contains beverage-related keywords (English/Polish)",
      },
      {
        keywords: [
          "bread",
          "croissant",
          "baguette",
          "roll",
          "cake",
          "muffin",
          "chleb",
          "bułka",
          "rogalik",
          "ciasto",
          "tort",
          "pączek",
        ],
        category: "Bakery",
        reasoning: "Contains bakery-related keywords (English/Polish)",
      },
      {
        keywords: [
          "chicken",
          "beef",
          "pork",
          "fish",
          "salmon",
          "tuna",
          "ham",
          "kurczak",
          "wołowina",
          "wieprzowina",
          "ryba",
          "łosoś",
          "tuńczyk",
          "szynka",
        ],
        category: "Meat & Seafood",
        reasoning: "Contains meat or seafood keywords (English/Polish)",
      },
      {
        keywords: [
          "chips",
          "cookies",
          "candy",
          "chocolate",
          "nuts",
          "crackers",
          "wedel",
          "chipsy",
          "ciastka",
          "cukierki",
          "czekolada",
          "orzechy",
          "krakersy",
        ],
        category: "Snacks",
        reasoning: "Contains snack-related keywords (English/Polish)",
      },
      {
        keywords: [
          "shampoo",
          "soap",
          "toothpaste",
          "deodorant",
          "lotion",
          "szampon",
          "mydło",
          "pasta do zębów",
          "dezodorant",
          "balsam",
        ],
        category: "Health & Beauty",
        reasoning: "Contains health/beauty keywords (English/Polish)",
      },
      {
        keywords: [
          "detergent",
          "cleaner",
          "paper",
          "towel",
          "bag",
          "detergent",
          "środek czyszczący",
          "papier",
          "ręcznik",
          "torba",
        ],
        category: "Household",
        reasoning: "Contains household item keywords (English/Polish)",
      },
      {
        keywords: [
          "dog food",
          "cat food",
          "pet food",
          "dog treats",
          "cat treats",
          "bird food",
          "fish food",
          "karma dla psa",
          "karma dla kota",
          "karma",
          "przysmaki dla psa",
          "przysmaki dla kota",
        ],
        category: "Pet Food",
        reasoning: "Contains pet/animal food keywords (English/Polish)",
      },
      {
        keywords: [
          "baby formula",
          "baby food",
          "diapers",
          "baby wipes",
          "pacifier",
          "baby bottle",
          "mleko dla niemowląt",
          "jedzenie dla dzieci",
          "pieluchy",
          "chusteczki dla dzieci",
          "smoczek",
        ],
        category: "Baby & Kids",
        reasoning: "Contains baby/children product keywords (English/Polish)",
      },
      {
        keywords: [
          "cereal",
          "corn flakes",
          "oatmeal",
          "granola",
          "muesli",
          "breakfast",
          "płatki śniadaniowe",
          "płatki kukurydziane",
          "owsianka",
          "musli",
        ],
        category: "Breakfast & Cereal",
        reasoning: "Contains breakfast/cereal keywords (English/Polish)",
      },
      {
        keywords: [
          "ketchup",
          "mustard",
          "mayo",
          "mayonnaise",
          "sauce",
          "vinegar",
          "oil",
          "salt",
          "pepper",
          "musztarda",
          "majonez",
          "sos",
          "ocet",
          "olej",
          "sól",
          "pieprz",
          "przyprawy",
        ],
        category: "Condiments & Sauces",
        reasoning: "Contains condiment/sauce keywords (English/Polish)",
      },
      {
        keywords: [
          "sandwich",
          "salad",
          "prepared",
          "ready meal",
          "rotisserie",
          "deli",
          "kanapka",
          "sałatka",
          "gotowe danie",
          "dania gotowe",
        ],
        category: "Deli & Prepared Foods",
        reasoning: "Contains prepared/deli food keywords (English/Polish)",
      },
      {
        keywords: [
          "sushi",
          "pasta",
          "rice",
          "noodles",
          "curry",
          "mexican",
          "asian",
          "italian",
          "makaron",
          "ryż",
          "azjatyckie",
          "włoskie",
          "meksykańskie",
        ],
        category: "International Foods",
        reasoning: "Contains international cuisine keywords (English/Polish)",
      },
    ];

    for (const rule of rules) {
      if (rule.keywords.some((keyword) => lowerName.includes(keyword))) {
        console.log(
          `✅ Categorized "${productName}" as "${rule.category}" (rule-based)`
        );
        return {
          category: rule.category,
          confidence: 0.8,
          reasoning: `Rule-based categorization: ${rule.reasoning}`,
          commonName: productName,
          success: true,
        };
      }
    }

    // Default fallback
    console.log(`📦 Using default category for "${productName}"`);
    return {
      category: "Pantry",
      confidence: 0.5,
      reasoning: "Default category - unable to determine specific category",
      commonName: productName,
      success: true,
    };
  }
}

// Export singleton instance
export const categorizationService = new CategorizationService();

// Export types for use in components
export type { ProductCategorizationResult };
