using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;

namespace ClientInfoFiller.Models
{
    /// <summary>
    /// Структура хранения данных в json между рестартами
    /// </summary>
    public class ConfigInfo
    {
        private ConfigInfo() { }
        [JsonIgnore]
        private const string ConfigInfoFileName = @"ConfigInfo.json";

        [JsonIgnore]
        private static ConfigInfo? _instance = null;

        [JsonIgnore]
        public static ConfigInfo Instance
        {
            get
            {
                if (_instance == null) _instance = LoadConfig();

                return (ConfigInfo)_instance;
            }
        }

        private static ConfigInfo LoadConfig()
        {
            string jsonConfigDataString = string.Empty;

            if (File.Exists(ConfigInfoFileName))
                jsonConfigDataString = File.ReadAllText(ConfigInfoFileName);


            ConfigInfo retval = new ConfigInfo();
            try
            {
                retval = JsonConvert.DeserializeObject<ConfigInfo>(jsonConfigDataString,
                    new JsonSerializerSettings
                    {
                        EqualityComparer = ReferenceEqualityComparer.Instance
                    }
                    ) ?? new ConfigInfo();
            }
            catch(Exception ex)
            {
                int a = 1;
            }

            return retval;
        }

        private static void SaveConfig()
        {
            string jsonConfig = JsonConvert.SerializeObject(ConfigInfo.Instance, Formatting.Indented,
                new JsonSerializerSettings
                {
                    EqualityComparer = ReferenceEqualityComparer.Instance
                }
            );
            File.WriteAllText(ConfigInfoFileName, jsonConfig);
        }


        #region Actual fields
        [JsonProperty("_excelToStoreSelledFilepath")]
        private string _excelToStoreSelledFilepath = string.Empty;
        /// <summary>
        /// Путь к excel файлу для продажи вещей.
        /// </summary>
        [JsonIgnore]
        public string ExcelToStoreSelledFilepath
        {
            get => _excelToStoreSelledFilepath;
            set
            {
                if (_excelToStoreSelledFilepath != value)
                {
                    _excelToStoreSelledFilepath = value;
                    SaveConfig();
                }
            }
        }
        #endregion
    }
}
