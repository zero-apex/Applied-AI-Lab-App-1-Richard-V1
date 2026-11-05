export const SAMPLE_TECH_SALES_CSV = `quarter,region,channel,product,units,discount_pct,revenue
Q1,North America,Direct,Cloud Enterprise,150,0.05,300000
Q1,North America,Partner,Analytics Suite,280,0.10,140000
Q1,North America,Online,Security Gateway,400,0.08,120000
Q1,EMEA,Direct,Cloud Enterprise,110,0.06,220000
Q1,EMEA,Partner,Hardware Hub,320,0.12,160000
Q1,Asia Pacific,Online,Hardware Hub,410,0.10,205000
Q1,Asia Pacific,Direct,Analytics Suite,190,0.08,95000
Q1,Latin America,Partner,Security Gateway,210,0.15,63000
Q2,North America,Direct,Cloud Enterprise,180,0.05,360000
Q2,North America,Partner,Analytics Suite,310,0.10,155000
Q2,North America,Online,Security Gateway,430,0.07,129000
Q2,EMEA,Direct,Cloud Enterprise,140,0.06,280000
Q2,EMEA,Partner,Hardware Hub,380,0.12,190000
Q2,EMEA,Online,Security Gateway,300,0.09,90000
Q2,Asia Pacific,Direct,Cloud Enterprise,130,0.08,260000
Q2,Asia Pacific,Online,Hardware Hub,390,0.10,195000
Q2,Asia Pacific,Partner,Analytics Suite,160,0.10,80000
Q2,Latin America,Partner,Security Gateway,240,0.15,72000
Q2,Latin America,Direct,Hardware Hub,180,0.12,90000
Q3,North America,Direct,Cloud Enterprise,205,0.05,410000
Q3,North America,Partner,Analytics Suite,330,0.10,165000
Q3,North America,Online,Security Gateway,460,0.07,138000
Q3,EMEA,Direct,Cloud Enterprise,115,0.08,230000
Q3,EMEA,Partner,Hardware Hub,290,0.14,145000
Q3,EMEA,Online,Security Gateway,260,0.10,78000
Q3,Asia Pacific,Direct,Cloud Enterprise,420,0.04,840000
Q3,Asia Pacific,Online,Hardware Hub,680,0.08,340000
Q3,Asia Pacific,Partner,Analytics Suite,350,0.06,175000
Q3,Latin America,Partner,Security Gateway,270,0.14,81000
Q3,Latin America,Direct,Hardware Hub,220,0.10,110000
Q4,North America,Direct,Cloud Enterprise,230,0.05,460000
Q4,North America,Partner,Analytics Suite,360,0.09,180000
Q4,EMEA,Direct,Cloud Enterprise,155,0.06,310000
Q4,Asia Pacific,Direct,Cloud Enterprise,480,0.04,960000
Q4,Asia Pacific,Online,Hardware Hub,710,0.08,355000
Q4,Latin America,Direct,Hardware Hub,250,0.10,125000`;

export const SAMPLE_RETAIL_SALES_CSV = `quarter,region,channel,product,units,discount_pct,revenue
Q1,East Region,Retail Store,Ultrabooks,240,0.05,240000
Q1,East Region,E-Commerce,Audio Gear,580,0.12,87000
Q1,West Region,Retail Store,Ultrabooks,180,0.06,180000
Q1,West Region,E-Commerce,Tablets,320,0.10,96000
Q1,Central Region,Wholesale,Ultrabooks,310,0.15,263500
Q1,South Region,Retail Store,Audio Gear,420,0.08,63000
Q2,East Region,Retail Store,Ultrabooks,260,0.05,260000
Q2,East Region,E-Commerce,Audio Gear,620,0.10,93000
Q2,East Region,Wholesale,Smart Displays,190,0.14,76000
Q2,West Region,Retail Store,Ultrabooks,190,0.06,190000
Q2,West Region,E-Commerce,Tablets,350,0.10,105000
Q2,West Region,Wholesale,Audio Gear,410,0.12,61500
Q2,Central Region,Wholesale,Ultrabooks,330,0.15,280500
Q2,Central Region,Retail Store,Tablets,250,0.08,75000
Q2,South Region,Retail Store,Audio Gear,450,0.08,67500
Q2,South Region,E-Commerce,Smart Displays,210,0.10,84000
Q3,East Region,Retail Store,Ultrabooks,275,0.05,275000
Q3,East Region,E-Commerce,Audio Gear,640,0.10,96000
Q3,East Region,Wholesale,Smart Displays,205,0.14,82000
Q3,West Region,Retail Store,Ultrabooks,490,0.04,490000
Q3,West Region,E-Commerce,Tablets,720,0.06,216000
Q3,West Region,Wholesale,Audio Gear,880,0.08,132000
Q3,Central Region,Wholesale,Ultrabooks,290,0.16,246500
Q3,Central Region,Retail Store,Tablets,240,0.08,72000
Q3,South Region,Retail Store,Audio Gear,470,0.08,70500
Q3,South Region,E-Commerce,Smart Displays,230,0.10,92000
Q4,East Region,Retail Store,Ultrabooks,310,0.05,310000
Q4,West Region,Retail Store,Ultrabooks,520,0.04,520000
Q4,Central Region,Wholesale,Ultrabooks,340,0.15,289000
Q4,South Region,Retail Store,Audio Gear,500,0.08,75000`;

export async function fetchLab1Csv(): Promise<string> {
  const res = await fetch('/assets/aistudio/Lab_1_-_Regional_Sales_de1de499.csv');
  if (!res.ok) {
    throw new Error('Failed to load Lab 1 CSV asset');
  }
  return res.text();
}
