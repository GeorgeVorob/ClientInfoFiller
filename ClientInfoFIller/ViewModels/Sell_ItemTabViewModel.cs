using ClientInfoFiller.Models;
using ClientInfoFiller.Services;
using ReactiveUI;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ClientInfoFiller.ViewModels
{
    public class Sell_ItemTabViewModel : ViewModelBase
    {
        #region Constructors
        public Sell_ItemTabViewModel()
        {
            _currentRow = new Row();

            UpdateFields();
        }
        #endregion

        #region Properties
        public bool CanAccessExcellSelledFile => ExcelSelledFilepath != null;
        public string ExcelSelledFilepath
        {
            // TODO: проклято-ли это?
            get => ConfigInfo.Instance.ExcelToStoreSelledFilepath;
            set
            {
                ConfigInfo.Instance.ExcelToStoreSelledFilepath = value;

                UpdateFields();
            }
        }

        private Row _currentRow;
        public Row CurrentRow
        {
            get => _currentRow;
            set
            {
                if (value == null)
                {
                    // dude why
                    return;
                }
                _currentRow = value;
                UpdateFields();
            }
        }
        #endregion

        #region Methods
        public void OnSellClick()
        {
            if (ExcelSelledFilepath == null) throw new Exception("Пожалуйста, укажите путь к файлу таблицы.");

            ExcelService excel = new ExcelService(new FileInfo(ExcelSelledFilepath));

            excel.SaveRow(this.CurrentRow);

            this.CurrentRow = new Row();
            UpdateFields();
        }

        public void UpdateFields()
        {
            this.RaisePropertyChanged(nameof(CurrentRow));
            this.RaisePropertyChanged();
            this.RaisePropertyChanged("");
            this.RaisePropertyChanged(nameof(ExcelSelledFilepath));
            this.RaisePropertyChanged(nameof(CanAccessExcellSelledFile));
        }
        #endregion
    }
}
