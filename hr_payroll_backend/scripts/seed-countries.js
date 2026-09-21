/**
 * Seed Master Countries
 * 
 * Populates the master_countries table with ISO 3166-1 standard country data
 * including Alpha-2 codes, Alpha-3 codes, proper flag emojis, nationalities,
 * phone codes, and currency information.
 * 
 * Usage: node scripts/seed-countries.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { MasterCountry, sequelize } = require('../models');

// ── ISO 3166-1 Country Data ──
// Format: [Alpha2, Alpha3, Name, Nationality, PhoneCode, CurrencyCode, CurrencySymbol]
const COUNTRIES = [
  ['AF', 'AFG', 'Afghanistan', 'Afghan', '+93', 'AFN', '؋'],
  ['AL', 'ALB', 'Albania', 'Albanian', '+355', 'ALL', 'L'],
  ['DZ', 'DZA', 'Algeria', 'Algerian', '+213', 'DZD', 'د.ج'],
  ['AD', 'AND', 'Andorra', 'Andorran', '+376', 'EUR', '€'],
  ['AO', 'AGO', 'Angola', 'Angolan', '+244', 'AOA', 'Kz'],
  ['AG', 'ATG', 'Antigua and Barbuda', 'Antiguan', '+1-268', 'XCD', '$'],
  ['AR', 'ARG', 'Argentina', 'Argentine', '+54', 'ARS', '$'],
  ['AM', 'ARM', 'Armenia', 'Armenian', '+374', 'AMD', '֏'],
  ['AU', 'AUS', 'Australia', 'Australian', '+61', 'AUD', '$'],
  ['AT', 'AUT', 'Austria', 'Austrian', '+43', 'EUR', '€'],
  ['AZ', 'AZE', 'Azerbaijan', 'Azerbaijani', '+994', 'AZN', '₼'],
  ['BS', 'BHS', 'Bahamas', 'Bahamian', '+1-242', 'BSD', '$'],
  ['BH', 'BHR', 'Bahrain', 'Bahraini', '+973', 'BHD', '.د.ب'],
  ['BD', 'BGD', 'Bangladesh', 'Bangladeshi', '+880', 'BDT', '৳'],
  ['BB', 'BRB', 'Barbados', 'Barbadian', '+1-246', 'BBD', '$'],
  ['BY', 'BLR', 'Belarus', 'Belarusian', '+375', 'BYN', 'Br'],
  ['BE', 'BEL', 'Belgium', 'Belgian', '+32', 'EUR', '€'],
  ['BZ', 'BLZ', 'Belize', 'Belizean', '+501', 'BZD', '$'],
  ['BJ', 'BEN', 'Benin', 'Beninese', '+229', 'XOF', 'Fr'],
  ['BT', 'BTN', 'Bhutan', 'Bhutanese', '+975', 'BTN', 'Nu.'],
  ['BO', 'BOL', 'Bolivia', 'Bolivian', '+591', 'BOB', 'Bs.'],
  ['BA', 'BIH', 'Bosnia and Herzegovina', 'Bosnian', '+387', 'BAM', 'KM'],
  ['BW', 'BWA', 'Botswana', 'Motswana', '+267', 'BWP', 'P'],
  ['BR', 'BRA', 'Brazil', 'Brazilian', '+55', 'BRL', 'R$'],
  ['BN', 'BRN', 'Brunei', 'Bruneian', '+673', 'BND', '$'],
  ['BG', 'BGR', 'Bulgaria', 'Bulgarian', '+359', 'BGN', 'лв'],
  ['BF', 'BFA', 'Burkina Faso', 'Burkinabe', '+226', 'XOF', 'Fr'],
  ['BI', 'BDI', 'Burundi', 'Burundian', '+257', 'BIF', 'Fr'],
  ['CV', 'CPV', 'Cabo Verde', 'Cape Verdean', '+238', 'CVE', '$'],
  ['KH', 'KHM', 'Cambodia', 'Cambodian', '+855', 'KHR', '៛'],
  ['CM', 'CMR', 'Cameroon', 'Cameroonian', '+237', 'XAF', 'Fr'],
  ['CA', 'CAN', 'Canada', 'Canadian', '+1', 'CAD', '$'],
  ['TD', 'TCD', 'Chad', 'Chadian', '+235', 'XAF', 'Fr'],
  ['CL', 'CHL', 'Chile', 'Chilean', '+56', 'CLP', '$'],
  ['CN', 'CHN', 'China', 'Chinese', '+86', 'CNY', '¥'],
  ['CO', 'COL', 'Colombia', 'Colombian', '+57', 'COP', '$'],
  ['KM', 'COM', 'Comoros', 'Comorian', '+269', 'KMF', 'Fr'],
  ['CG', 'COG', 'Congo', 'Congolese', '+242', 'XAF', 'Fr'],
  ['CD', 'COD', 'DR Congo', 'Congolese', '+243', 'CDF', 'Fr'],
  ['CR', 'CRI', 'Costa Rica', 'Costa Rican', '+506', 'CRC', '₡'],
  ['CI', 'CIV', "Côte d'Ivoire", 'Ivorian', '+225', 'XOF', 'Fr'],
  ['HR', 'HRV', 'Croatia', 'Croatian', '+385', 'EUR', '€'],
  ['CU', 'CUB', 'Cuba', 'Cuban', '+53', 'CUP', '$'],
  ['CY', 'CYP', 'Cyprus', 'Cypriot', '+357', 'EUR', '€'],
  ['CZ', 'CZE', 'Czech Republic', 'Czech', '+420', 'CZK', 'Kč'],
  ['DK', 'DNK', 'Denmark', 'Danish', '+45', 'DKK', 'kr'],
  ['DJ', 'DJI', 'Djibouti', 'Djiboutian', '+253', 'DJF', 'Fr'],
  ['DM', 'DMA', 'Dominica', 'Dominican', '+1-767', 'XCD', '$'],
  ['DO', 'DOM', 'Dominican Republic', 'Dominican', '+1-809', 'DOP', '$'],
  ['EC', 'ECU', 'Ecuador', 'Ecuadorian', '+593', 'USD', '$'],
  ['EG', 'EGY', 'Egypt', 'Egyptian', '+20', 'EGP', '£'],
  ['SV', 'SLV', 'El Salvador', 'Salvadoran', '+503', 'USD', '$'],
  ['GQ', 'GNQ', 'Equatorial Guinea', 'Equatorial Guinean', '+240', 'XAF', 'Fr'],
  ['ER', 'ERI', 'Eritrea', 'Eritrean', '+291', 'ERN', 'Nfk'],
  ['EE', 'EST', 'Estonia', 'Estonian', '+372', 'EUR', '€'],
  ['SZ', 'SWZ', 'Eswatini', 'Swazi', '+268', 'SZL', 'L'],
  ['ET', 'ETH', 'Ethiopia', 'Ethiopian', '+251', 'ETB', 'Br'],
  ['FJ', 'FJI', 'Fiji', 'Fijian', '+679', 'FJD', '$'],
  ['FI', 'FIN', 'Finland', 'Finnish', '+358', 'EUR', '€'],
  ['FR', 'FRA', 'France', 'French', '+33', 'EUR', '€'],
  ['GA', 'GAB', 'Gabon', 'Gabonese', '+241', 'XAF', 'Fr'],
  ['GM', 'GMB', 'Gambia', 'Gambian', '+220', 'GMD', 'D'],
  ['GE', 'GEO', 'Georgia', 'Georgian', '+995', 'GEL', '₾'],
  ['DE', 'DEU', 'Germany', 'German', '+49', 'EUR', '€'],
  ['GH', 'GHA', 'Ghana', 'Ghanaian', '+233', 'GHS', '₵'],
  ['GR', 'GRC', 'Greece', 'Greek', '+30', 'EUR', '€'],
  ['GD', 'GRD', 'Grenada', 'Grenadian', '+1-473', 'XCD', '$'],
  ['GT', 'GTM', 'Guatemala', 'Guatemalan', '+502', 'GTQ', 'Q'],
  ['GN', 'GIN', 'Guinea', 'Guinean', '+224', 'GNF', 'Fr'],
  ['GW', 'GNB', 'Guinea-Bissau', 'Bissau-Guinean', '+245', 'XOF', 'Fr'],
  ['GY', 'GUY', 'Guyana', 'Guyanese', '+592', 'GYD', '$'],
  ['HT', 'HTI', 'Haiti', 'Haitian', '+509', 'HTG', 'G'],
  ['HN', 'HND', 'Honduras', 'Honduran', '+504', 'HNL', 'L'],
  ['HU', 'HUN', 'Hungary', 'Hungarian', '+36', 'HUF', 'Ft'],
  ['IS', 'ISL', 'Iceland', 'Icelandic', '+354', 'ISK', 'kr'],
  ['IN', 'IND', 'India', 'Indian', '+91', 'INR', '₹'],
  ['ID', 'IDN', 'Indonesia', 'Indonesian', '+62', 'IDR', 'Rp'],
  ['IR', 'IRN', 'Iran', 'Iranian', '+98', 'IRR', '﷼'],
  ['IQ', 'IRQ', 'Iraq', 'Iraqi', '+964', 'IQD', 'ع.د'],
  ['IE', 'IRL', 'Ireland', 'Irish', '+353', 'EUR', '€'],
  ['IL', 'ISR', 'Israel', 'Israeli', '+972', 'ILS', '₪'],
  ['IT', 'ITA', 'Italy', 'Italian', '+39', 'EUR', '€'],
  ['JM', 'JAM', 'Jamaica', 'Jamaican', '+1-876', 'JMD', '$'],
  ['JP', 'JPN', 'Japan', 'Japanese', '+81', 'JPY', '¥'],
  ['JO', 'JOR', 'Jordan', 'Jordanian', '+962', 'JOD', 'د.ا'],
  ['KZ', 'KAZ', 'Kazakhstan', 'Kazakhstani', '+7', 'KZT', '₸'],
  ['KE', 'KEN', 'Kenya', 'Kenyan', '+254', 'KES', 'Sh'],
  ['KI', 'KIR', 'Kiribati', 'I-Kiribati', '+686', 'AUD', '$'],
  ['KP', 'PRK', 'North Korea', 'North Korean', '+850', 'KPW', '₩'],
  ['KR', 'KOR', 'South Korea', 'South Korean', '+82', 'KRW', '₩'],
  ['KW', 'KWT', 'Kuwait', 'Kuwaiti', '+965', 'KWD', 'د.ك'],
  ['KG', 'KGZ', 'Kyrgyzstan', 'Kyrgyzstani', '+996', 'KGS', 'с'],
  ['LA', 'LAO', 'Laos', 'Lao', '+856', 'LAK', '₭'],
  ['LV', 'LVA', 'Latvia', 'Latvian', '+371', 'EUR', '€'],
  ['LB', 'LBN', 'Lebanon', 'Lebanese', '+961', 'LBP', 'ل.ل'],
  ['LS', 'LSO', 'Lesotho', 'Mosotho', '+266', 'LSL', 'L'],
  ['LR', 'LBR', 'Liberia', 'Liberian', '+231', 'LRD', '$'],
  ['LY', 'LBY', 'Libya', 'Libyan', '+218', 'LYD', 'ل.د'],
  ['LI', 'LIE', 'Liechtenstein', 'Liechtensteiner', '+423', 'CHF', 'Fr'],
  ['LT', 'LTU', 'Lithuania', 'Lithuanian', '+370', 'EUR', '€'],
  ['LU', 'LUX', 'Luxembourg', 'Luxembourger', '+352', 'EUR', '€'],
  ['MG', 'MDG', 'Madagascar', 'Malagasy', '+261', 'MGA', 'Ar'],
  ['MW', 'MWI', 'Malawi', 'Malawian', '+265', 'MWK', 'MK'],
  ['MY', 'MYS', 'Malaysia', 'Malaysian', '+60', 'MYR', 'RM'],
  ['MV', 'MDV', 'Maldives', 'Maldivian', '+960', 'MVR', '.ރ'],
  ['ML', 'MLI', 'Mali', 'Malian', '+223', 'XOF', 'Fr'],
  ['MT', 'MLT', 'Malta', 'Maltese', '+356', 'EUR', '€'],
  ['MH', 'MHL', 'Marshall Islands', 'Marshallese', '+692', 'USD', '$'],
  ['MR', 'MRT', 'Mauritania', 'Mauritanian', '+222', 'MRU', 'UM'],
  ['MU', 'MUS', 'Mauritius', 'Mauritian', '+230', 'MUR', '₨'],
  ['MX', 'MEX', 'Mexico', 'Mexican', '+52', 'MXN', '$'],
  ['FM', 'FSM', 'Micronesia', 'Micronesian', '+691', 'USD', '$'],
  ['MD', 'MDA', 'Moldova', 'Moldovan', '+373', 'MDL', 'L'],
  ['MC', 'MCO', 'Monaco', 'Monegasque', '+377', 'EUR', '€'],
  ['MN', 'MNG', 'Mongolia', 'Mongolian', '+976', 'MNT', '₮'],
  ['ME', 'MNE', 'Montenegro', 'Montenegrin', '+382', 'EUR', '€'],
  ['MA', 'MAR', 'Morocco', 'Moroccan', '+212', 'MAD', 'د.م.'],
  ['MZ', 'MOZ', 'Mozambique', 'Mozambican', '+258', 'MZN', 'MT'],
  ['MM', 'MMR', 'Myanmar', 'Burmese', '+95', 'MMK', 'Ks'],
  ['NA', 'NAM', 'Namibia', 'Namibian', '+264', 'NAD', '$'],
  ['NR', 'NRU', 'Nauru', 'Nauruan', '+674', 'AUD', '$'],
  ['NP', 'NPL', 'Nepal', 'Nepali', '+977', 'NPR', '₨'],
  ['NL', 'NLD', 'Netherlands', 'Dutch', '+31', 'EUR', '€'],
  ['NZ', 'NZL', 'New Zealand', 'New Zealander', '+64', 'NZD', '$'],
  ['NI', 'NIC', 'Nicaragua', 'Nicaraguan', '+505', 'NIO', 'C$'],
  ['NE', 'NER', 'Niger', 'Nigerien', '+227', 'XOF', 'Fr'],
  ['NG', 'NGA', 'Nigeria', 'Nigerian', '+234', 'NGN', '₦'],
  ['MK', 'MKD', 'North Macedonia', 'Macedonian', '+389', 'MKD', 'ден'],
  ['NO', 'NOR', 'Norway', 'Norwegian', '+47', 'NOK', 'kr'],
  ['OM', 'OMN', 'Oman', 'Omani', '+968', 'OMR', 'ر.ع.'],
  ['PK', 'PAK', 'Pakistan', 'Pakistani', '+92', 'PKR', '₨'],
  ['PW', 'PLW', 'Palau', 'Palauan', '+680', 'USD', '$'],
  ['PS', 'PSE', 'Palestine', 'Palestinian', '+970', 'ILS', '₪'],
  ['PA', 'PAN', 'Panama', 'Panamanian', '+507', 'PAB', 'B/.'],
  ['PG', 'PNG', 'Papua New Guinea', 'Papua New Guinean', '+675', 'PGK', 'K'],
  ['PY', 'PRY', 'Paraguay', 'Paraguayan', '+595', 'PYG', '₲'],
  ['PE', 'PER', 'Peru', 'Peruvian', '+51', 'PEN', 'S/.'],
  ['PH', 'PHL', 'Philippines', 'Filipino', '+63', 'PHP', '₱'],
  ['PL', 'POL', 'Poland', 'Polish', '+48', 'PLN', 'zł'],
  ['PT', 'PRT', 'Portugal', 'Portuguese', '+351', 'EUR', '€'],
  ['QA', 'QAT', 'Qatar', 'Qatari', '+974', 'QAR', 'ر.ق'],
  ['RO', 'ROU', 'Romania', 'Romanian', '+40', 'RON', 'lei'],
  ['RU', 'RUS', 'Russia', 'Russian', '+7', 'RUB', '₽'],
  ['RW', 'RWA', 'Rwanda', 'Rwandan', '+250', 'RWF', 'Fr'],
  ['KN', 'KNA', 'Saint Kitts and Nevis', 'Kittitian', '+1-869', 'XCD', '$'],
  ['LC', 'LCA', 'Saint Lucia', 'Saint Lucian', '+1-758', 'XCD', '$'],
  ['VC', 'VCT', 'Saint Vincent and the Grenadines', 'Vincentian', '+1-784', 'XCD', '$'],
  ['WS', 'WSM', 'Samoa', 'Samoan', '+685', 'WST', 'T'],
  ['SM', 'SMR', 'San Marino', 'Sammarinese', '+378', 'EUR', '€'],
  ['ST', 'STP', 'Sao Tome and Principe', 'Sao Tomean', '+239', 'STN', 'Db'],
  ['SA', 'SAU', 'Saudi Arabia', 'Saudi', '+966', 'SAR', 'ر.س'],
  ['SN', 'SEN', 'Senegal', 'Senegalese', '+221', 'XOF', 'Fr'],
  ['RS', 'SRB', 'Serbia', 'Serbian', '+381', 'RSD', 'дин.'],
  ['SC', 'SYC', 'Seychelles', 'Seychellois', '+248', 'SCR', '₨'],
  ['SL', 'SLE', 'Sierra Leone', 'Sierra Leonean', '+232', 'SLL', 'Le'],
  ['SG', 'SGP', 'Singapore', 'Singaporean', '+65', 'SGD', '$'],
  ['SK', 'SVK', 'Slovakia', 'Slovak', '+421', 'EUR', '€'],
  ['SI', 'SVN', 'Slovenia', 'Slovenian', '+386', 'EUR', '€'],
  ['SB', 'SLB', 'Solomon Islands', 'Solomon Islander', '+677', 'SBD', '$'],
  ['SO', 'SOM', 'Somalia', 'Somali', '+252', 'SOS', 'Sh'],
  ['ZA', 'ZAF', 'South Africa', 'South African', '+27', 'ZAR', 'R'],
  ['SS', 'SSD', 'South Sudan', 'South Sudanese', '+211', 'SSP', '£'],
  ['ES', 'ESP', 'Spain', 'Spanish', '+34', 'EUR', '€'],
  ['LK', 'LKA', 'Sri Lanka', 'Sri Lankan', '+94', 'LKR', '₨'],
  ['SD', 'SDN', 'Sudan', 'Sudanese', '+249', 'SDG', 'ج.س.'],
  ['SR', 'SUR', 'Suriname', 'Surinamese', '+597', 'SRD', '$'],
  ['SE', 'SWE', 'Sweden', 'Swedish', '+46', 'SEK', 'kr'],
  ['CH', 'CHE', 'Switzerland', 'Swiss', '+41', 'CHF', 'Fr'],
  ['SY', 'SYR', 'Syria', 'Syrian', '+963', 'SYP', '£'],
  ['TW', 'TWN', 'Taiwan', 'Taiwanese', '+886', 'TWD', 'NT$'],
  ['TJ', 'TJK', 'Tajikistan', 'Tajikistani', '+992', 'TJS', 'ЅМ'],
  ['TZ', 'TZA', 'Tanzania', 'Tanzanian', '+255', 'TZS', 'Sh'],
  ['TH', 'THA', 'Thailand', 'Thai', '+66', 'THB', '฿'],
  ['TL', 'TLS', 'Timor-Leste', 'Timorese', '+670', 'USD', '$'],
  ['TG', 'TGO', 'Togo', 'Togolese', '+228', 'XOF', 'Fr'],
  ['TO', 'TON', 'Tonga', 'Tongan', '+676', 'TOP', 'T$'],
  ['TT', 'TTO', 'Trinidad and Tobago', 'Trinidadian', '+1-868', 'TTD', '$'],
  ['TN', 'TUN', 'Tunisia', 'Tunisian', '+216', 'TND', 'د.ت'],
  ['TR', 'TUR', 'Turkey', 'Turkish', '+90', 'TRY', '₺'],
  ['TM', 'TKM', 'Turkmenistan', 'Turkmen', '+993', 'TMT', 'm'],
  ['TV', 'TUV', 'Tuvalu', 'Tuvaluan', '+688', 'AUD', '$'],
  ['UG', 'UGA', 'Uganda', 'Ugandan', '+256', 'UGX', 'Sh'],
  ['UA', 'UKR', 'Ukraine', 'Ukrainian', '+380', 'UAH', '₴'],
  ['AE', 'ARE', 'United Arab Emirates', 'Emirati', '+971', 'AED', 'د.إ'],
  ['GB', 'GBR', 'United Kingdom', 'British', '+44', 'GBP', '£'],
  ['US', 'USA', 'United States', 'American', '+1', 'USD', '$'],
  ['UY', 'URY', 'Uruguay', 'Uruguayan', '+598', 'UYU', '$'],
  ['UZ', 'UZB', 'Uzbekistan', 'Uzbekistani', '+998', 'UZS', "so'm"],
  ['VU', 'VUT', 'Vanuatu', 'Ni-Vanuatu', '+678', 'VUV', 'Vt'],
  ['VA', 'VAT', 'Vatican City', 'Vatican', '+379', 'EUR', '€'],
  ['VE', 'VEN', 'Venezuela', 'Venezuelan', '+58', 'VES', 'Bs.'],
  ['VN', 'VNM', 'Vietnam', 'Vietnamese', '+84', 'VND', '₫'],
  ['YE', 'YEM', 'Yemen', 'Yemeni', '+967', 'YER', '﷼'],
  ['ZM', 'ZMB', 'Zambia', 'Zambian', '+260', 'ZMW', 'ZK'],
  ['ZW', 'ZWE', 'Zimbabwe', 'Zimbabwean', '+263', 'ZWL', '$'],
];

/**
 * Generate flag emoji from Alpha-2 country code.
 * Each letter is converted to a Regional Indicator Symbol (U+1F1E6 to U+1F1FF).
 */
function flagEmoji(countryCode) {
  const base = 0x1F1E6;
  return String.fromCodePoint(base + countryCode.charCodeAt(0) - 'A'.charCodeAt(0))
       + String.fromCodePoint(base + countryCode.charCodeAt(1) - 'A'.charCodeAt(0));
}

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get tenant ID — use from env or find the first available
    const tenantId = process.env.SEED_TENANT_ID || await (async () => {
      const [rows] = await sequelize.query(
        "SELECT DISTINCT company_id as id FROM user_companies LIMIT 1"
      );
      if (rows && rows.length > 0) return rows[0].id;
      return '11111111-1111-1111-1111-111111111111';
    })();
    console.log(`Seeding for tenant: ${tenantId}`);

    // Clear existing countries (delete children first to avoid FK constraints)
    await sequelize.query('DELETE FROM master_cities WHERE tenant_id = ?', { replacements: [tenantId] });
    await sequelize.query('DELETE FROM master_states WHERE tenant_id = ?', { replacements: [tenantId] });
    const deleted = await MasterCountry.destroy({ where: { tenantId }, force: true });
    console.log(`Cleared ${deleted} existing countries`);

    // Insert all countries
    let inserted = 0;
    for (const [code, alpha3, name, nationality, phoneCode, currencyCode, currencySymbol] of COUNTRIES) {
      await MasterCountry.create({
        tenantId,
        code,
        name,
        nationality,
        nameAr: null,
        nationalityAr: null,
        phoneCode,
        currencyCode,
        currencySymbol,
        flagEmoji: flagEmoji(code),
        isSystem: true,
        isActive: true,
        sortOrder: inserted + 1,
      });
      inserted++;
    }

    console.log(`✅ Seeded ${inserted} countries with proper ISO data and flag emojis`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
