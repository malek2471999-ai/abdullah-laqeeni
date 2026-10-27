-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**

-keepclassmembers class **$$serializer { *; }
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,includedescriptorclasses class com.abdullah.laqeeni.**$$serializer { *; }
-keep,allowobfuscation,allowshrinking class kotlinx.serialization.Serializable

-keep class org.maplibre.android.** { *; }
-dontwarn org.maplibre.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

-keepclassmembers class * extends androidx.room.RoomDatabase { <init>(); }
